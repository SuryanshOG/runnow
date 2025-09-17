package config

import (
	"os"
)

type Config struct {
	Port       string
	MongoURI   string
	JWTSecret  string
	PistonURL  string
	Env        string
	GithubID   string
	GithubSecret string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017/runnow"
	}
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "runnow-dev-secret-change-in-prod-32chars"
	}
	piston := os.Getenv("PISTON_URL")
	if piston == "" {
		piston = "https://emkc.org/api/v2/piston"
	}
	env := os.Getenv("ENV")
	if env == "" {
		env = "development"
	}
	return &Config{
		Port:         port,
		MongoURI:     mongoURI,
		JWTSecret:    secret,
		PistonURL:    piston,
		Env:          env,
		GithubID:     os.Getenv("GITHUB_CLIENT_ID"),
		GithubSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
	}
}
