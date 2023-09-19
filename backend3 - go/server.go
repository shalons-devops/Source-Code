package main

import (
    "encoding/json"
    "database/sql"
    "fmt"
    "log"
    "net/http"
    "os"

    // "github.com/gorilla/mux"
    _ "github.com/lib/pq"

    "context"

    "time"

    "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/exporters/jaeger"
    "go.opentelemetry.io/otel/sdk/resource"
    tracesdk "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.7.0"
)

var (
	host     string
	port     string
	user     string
	password string
	dbname   string
)

const (
    service     = "go-service"
    environment = "development"
    id          = 1
)

var db *sql.DB

type User struct {
    Typess      string `json:"typess"`
    NameOfUser  string `json:"nameofuser"`
}


func tracerProvider(url string) (*tracesdk.TracerProvider, error) {
    // Create the Jaeger exporter
    exp, err := jaeger.New(jaeger.WithCollectorEndpoint(jaeger.WithEndpoint(url)))
    if err != nil {
        return nil, err
    }
    tp := tracesdk.NewTracerProvider(
        // Always be sure to batch in production.
        tracesdk.WithBatcher(exp),
        // Record information about this application in a Resource.
        tracesdk.WithResource(resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceNameKey.String(service),
            attribute.String("environment", environment),
            attribute.Int64("ID", id),
        )),
    )
    return tp, nil
}



func main() {

	host = os.Getenv("DB_HOST")
	port = os.Getenv("DB_PORT")
	user = os.Getenv("DB_USER")
	password = os.Getenv("DB_PASSWORD")
	dbname = os.Getenv("DB_NAME")

    tp, err1 := tracerProvider("http://10.152.183.244:14268/api/traces")
    if err1 != nil {
        log.Fatal(err1)
    }

    // Register our TracerProvider as the global so any imported
    // instrumentation in the future will default to using it.
    otel.SetTracerProvider(tp)

    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    // Cleanly shutdown and flush telemetry when the application exits.
    defer func(ctx context.Context) {
        // Do not make the application hang when it is shutdown.
        ctx, cancel = context.WithTimeout(ctx, time.Second*5)
        defer cancel()
        if err1 := tp.Shutdown(ctx); err1 != nil {
            log.Fatal(err1)
        }
    }(ctx)

    tr := tp.Tracer("component-main")

    ctx, span := tr.Start(ctx, "hello")
    defer span.End()





    // Initialize the database connection
    connStr := fmt.Sprintf("host=%s port=5432 user=%s password=%s dbname=%s sslmode=disable",
        host, user, password, dbname)

    var err error
    db, err = sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    // Create a new router using mux
    helloHandler :=  func(w http.ResponseWriter, r *http.Request) {
        tr := otel.Tracer("hello-handler")
        _, span := tr.Start(ctx, "hello")
        span.SetAttributes(attribute.Key("testset").String("value"))
        defer span.End()

        nameParam := r.URL.Query().Get("nameofuser")

        // Customize your SQL query based on the "nameofuser" parameter
        var query string
        var args []interface{}
    
        if nameParam != "" {
            query = "SELECT typess, nameofuser FROM usernames WHERE nameofuser = $1"
            args = []interface{}{nameParam}
        }else if nameParam == "nand" {
            query = "SELECT typess, nameofuser FROM usernames WHERE nameofuser = $1"
            args = []interface{}{nameParam}
        }else {
            query = "SELECT typess, nameofuser FROM usernames"
        }
    
        rows, err := db.Query(query, args...)
        if err != nil {
            fmt.Println("Error executing query:", err) // Print the error message to the terminal
            log.Printf("%s %s %s 500\n", r.RemoteAddr, r.Method, r.URL.Path)
            http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            return
        }
        defer rows.Close()
    
        var users []User
        for rows.Next() {
            var user User
            err := rows.Scan(&user.Typess, &user.NameOfUser)
            if err != nil {
                fmt.Println("Error scanning row:", err) // Print the error message to the terminal
                log.Printf("%s %s %s 500\n", r.RemoteAddr, r.Method, r.URL.Path)
                http.Error(w, "Internal Server Error", http.StatusInternalServerError)
                return
            }
            users = append(users, user)
        }
    
        if err := rows.Err(); err != nil {
            fmt.Println("Error iterating rows:", err) // Print the error message to the terminal
            log.Printf("%s %s %s 500\n", r.RemoteAddr, r.Method, r.URL.Path)
            http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            return
        }
    
        // Check if there are no users and return a 500 error in that case
        if len(users) == 0 {
            fmt.Println("No users found") // Print the message to the terminal
            log.Printf("%s %s %s 500\n", r.RemoteAddr, r.Method, r.URL.Path)
            http.Error(w, "Internal Server Error: No users found", http.StatusInternalServerError)
            return
        }
    
        // Convert the result to JSON and send it as the response
        w.Header().Set("Content-Type", "application/json")
        if err := json.NewEncoder(w).Encode(users); err != nil {
            fmt.Println("Error encoding JSON:", err) // Print the error message to the terminal
            log.Printf("%s %s %s 500\n", r.RemoteAddr, r.Method, r.URL.Path)
            http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            return
        }
    }

    // Define a route to retrieve data from PostgreSQL
    otelHandler := otelhttp.NewHandler(http.HandlerFunc(helloHandler), "Go-DB")

    http.Handle("/postgres", otelHandler)

    port := os.Getenv("PORT")
    if port == "" {
        port = "3003"
    }

    // Start the Go web server
	log.Printf("Server is running on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}