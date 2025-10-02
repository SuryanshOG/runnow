package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/runnow/api/internal/models"
	"github.com/runnow/api/internal/services"
)

type ExecuteHandler struct {
	Piston *services.PistonService
}

func NewExecuteHandler(p *services.PistonService) *ExecuteHandler {
	return &ExecuteHandler{Piston: p}
}

func (h *ExecuteHandler) Runtimes(c *gin.Context) {
	runtimes, err := h.Piston.GetRuntimes()
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch runtimes", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, runtimes)
}

func (h *ExecuteHandler) Execute(c *gin.Context) {
	var req models.ExecutionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Version == "" {
		req.Version = "*"
	}
	result, err := h.Piston.Execute(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ExecuteHandler) Languages(c *gin.Context) {
	runtimes, err := h.Piston.GetRuntimes()
	if err != nil {
		c.JSON(http.StatusOK, fallbackLanguages())
		return
	}
	mapped := make([]gin.H, 0, len(runtimes))
	for _, r := range runtimes {
		mapped = append(mapped, gin.H{
			"language": r.Language,
			"version":  r.Version,
			"aliases":  r.Aliases,
			"runtime":  r.Runtime,
			"client":   isClientSide(r.Language),
		})
	}
	c.JSON(http.StatusOK, mapped)
}

func isClientSide(lang string) bool {
	switch lang {
	case "javascript", "typescript", "python", "ruby", "lua", "sql":
		return true
	default:
		return false
	}
}

func fallbackLanguages() []gin.H {
	langs := []string{"javascript", "typescript", "python", "go", "rust", "java", "cpp", "c", "csharp", "php", "ruby", "swift", "kotlin", "scala", "haskell", "elixir", "erlang", "dart", "r", "julia", "perl", "lua", "bash", "powershell", "zig", "nim", "ocaml", "clojure", "fsharp", "fortran", "assembly", "sql", "html", "css"}
	out := make([]gin.H, 0, len(langs))
	for _, l := range langs {
		out = append(out, gin.H{"language": l, "version": "*", "aliases": []string{l}, "runtime": l})
	}
	return out
}
