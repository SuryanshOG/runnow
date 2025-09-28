package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/runnow/api/internal/models"
)

type PistonService struct {
	BaseURL string
	Client  *http.Client
}

func NewPistonService(url string) *PistonService {
	return &PistonService{
		BaseURL: url,
		Client:  &http.Client{Timeout: 25 * time.Second},
	}
}

func (p *PistonService) GetRuntimes() ([]models.PistonRuntime, error) {
	resp, err := p.Client.Get(p.BaseURL + "/runtimes")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var runtimes []models.PistonRuntime
	if err := json.NewDecoder(resp.Body).Decode(&runtimes); err != nil {
		return nil, err
	}
	return runtimes, nil
}

func (p *PistonService) Execute(req models.ExecutionRequest) (*models.ExecutionResult, error) {
	payload := map[string]interface{}{
		"language": req.Language,
		"version":  req.Version,
		"files":    req.Files,
		"stdin":    req.Stdin,
		"args":     req.Args,
	}
	if payload["version"] == "" {
		payload["version"] = "*"
	}
	body, _ := json.Marshal(payload)
	httpReq, err := http.NewRequest("POST", p.BaseURL+"/execute", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	resp, err := p.Client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("piston error %d: %s", resp.StatusCode, string(respBody))
	}
	var result models.ExecutionResult
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, err
	}
	return &result, nil
}
