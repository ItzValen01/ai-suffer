package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sort"
	"strings"
	"sync"
	"time"
)

type Score struct {
	Name  string `json:"name"`
	Score int    `json:"score"`
	Floor int    `json:"floor"`
	Date  string `json:"date"`
}
type Profile struct {
	Name                 string   `json:"name"`
	BestScore            int      `json:"bestScore"`
	BestFloor            int      `json:"bestFloor"`
	BestCombo            int      `json:"bestCombo"`
	MostKills            int      `json:"mostKills"`
	FastestWin           float64  `json:"fastestWin"`
	Runs                 int      `json:"runs"`
	Wins                 int      `json:"wins"`
	TotalKills           int      `json:"totalKills"`
	TotalScrap           int      `json:"totalScrap"`
	UnlockedPets         []string `json:"unlockedPets"`
	SelectedPet          string   `json:"selectedPet"`
	CharacterColor       string   `json:"characterColor"`
	HardBossWins         int      `json:"hardBossWins"`
	HackerWins           int      `json:"hackerWins"`
	HackerBossWins       int      `json:"hackerBossWins"`
	BossWins             int      `json:"bossWins"`
	PerfectBossWins      int      `json:"perfectBossWins"`
	BestAccuracy         float64  `json:"bestAccuracy"`
	EnemyDodges          int      `json:"enemyDodges"`
	BossDodges           int      `json:"bossDodges"`
	UnlockedAchievements []string `json:"unlockedAchievements"`
	LastSeen             string   `json:"lastSeen"`
}
type persistentStore struct {
	mu       sync.Mutex
	Scores   []Score            `json:"scores"`
	Profiles map[string]Profile `json:"profiles"`
}

var store = &persistentStore{Profiles: map[string]Profile{}}

const dataFile = "data.json"

func loadStore() {
	b, err := os.ReadFile(dataFile)
	if err != nil {
		return
	}
	var disk persistentStore
	if json.Unmarshal(b, &disk) == nil {
		if disk.Profiles == nil {
			disk.Profiles = map[string]Profile{}
		}
		store.Scores = disk.Scores
		store.Profiles = disk.Profiles
	}
}
func saveStoreLocked() {
	b, _ := json.MarshalIndent(store, "", "  ")
	tmp := dataFile + ".tmp"
	if os.WriteFile(tmp, b, 0644) == nil {
		_ = os.Rename(tmp, dataFile)
	}
}
func keyName(s string) string { return strings.ToLower(strings.TrimSpace(s)) }
func withJSON(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
}
func (s *persistentStore) addScore(sc Score) {
	s.mu.Lock()
	defer s.mu.Unlock()
	sc.Date = time.Now().Format("2006-01-02 15:04")
	s.Scores = append(s.Scores, sc)
	sort.Slice(s.Scores, func(i, j int) bool { return s.Scores[i].Score > s.Scores[j].Score })
	if len(s.Scores) > 50 {
		s.Scores = s.Scores[:50]
	}
	saveStoreLocked()
}
func (s *persistentStore) top() []Score {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := append([]Score(nil), s.Scores...)
	return out
}

func handleHighscores(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		withJSON(w)
		_ = json.NewEncoder(w).Encode(store.top())
	case http.MethodPost:
		var sc Score
		if json.NewDecoder(r.Body).Decode(&sc) != nil {
			http.Error(w, "cuerpo invalido", 400)
			return
		}
		if sc.Name == "" {
			sc.Name = "Anonimo"
		}
		if len(sc.Name) > 20 {
			sc.Name = sc.Name[:20]
		}
		if sc.Score < 0 {
			sc.Score = 0
		}
		store.addScore(sc)
		withJSON(w)
		_ = json.NewEncoder(w).Encode(store.top())
	default:
		http.Error(w, "metodo no permitido", 405)
	}
}

func handleProfile(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		http.Error(w, "nombre requerido", 400)
		return
	}
	if len(name) > 20 {
		name = name[:20]
	}
	k := keyName(name)
	switch r.Method {
	case http.MethodGet:
		store.mu.Lock()
		p, ok := store.Profiles[k]
		store.mu.Unlock()
		if !ok {
			p = Profile{Name: name}
		}
		withJSON(w)
		_ = json.NewEncoder(w).Encode(p)
	case http.MethodPost:
		var p Profile
		if json.NewDecoder(r.Body).Decode(&p) != nil {
			http.Error(w, "cuerpo invalido", 400)
			return
		}
		p.Name = name
		p.LastSeen = time.Now().Format(time.RFC3339)
		store.mu.Lock()
		old := store.Profiles[k]
		if p.BestScore < old.BestScore {
			p.BestScore = old.BestScore
		}
		if p.BestFloor < old.BestFloor {
			p.BestFloor = old.BestFloor
		}
		if p.BestCombo < old.BestCombo {
			p.BestCombo = old.BestCombo
		}
		if p.MostKills < old.MostKills {
			p.MostKills = old.MostKills
		}
		if p.FastestWin == 0 || (old.FastestWin > 0 && old.FastestWin < p.FastestWin) {
			p.FastestWin = old.FastestWin
		}
		if p.Runs < old.Runs {
			p.Runs = old.Runs
		}
		if p.Wins < old.Wins {
			p.Wins = old.Wins
		}
		if p.TotalKills < old.TotalKills {
			p.TotalKills = old.TotalKills
		}
		if p.TotalScrap < old.TotalScrap {
			p.TotalScrap = old.TotalScrap
		}
		if p.HardBossWins < old.HardBossWins {
			p.HardBossWins = old.HardBossWins
		}
		if p.HackerWins < old.HackerWins {
			p.HackerWins = old.HackerWins
		}
		if p.HackerBossWins < old.HackerBossWins {
			p.HackerBossWins = old.HackerBossWins
		}
		if p.BossWins < old.BossWins {
			p.BossWins = old.BossWins
		}
		petSet := map[string]bool{}
		for _, id := range old.UnlockedPets {
			petSet[id] = true
		}
		for _, id := range p.UnlockedPets {
			petSet[id] = true
		}
		p.UnlockedPets = p.UnlockedPets[:0]
		for _, id := range []string{"byte", "echo", "cat", "fox", "glitch", "sentinel", "wolf", "mimic", "owl", "shark", "core", "dragon", "phoenix", "void"} {
			if petSet[id] {
				p.UnlockedPets = append(p.UnlockedPets, id)
			}
		}
		achievementSet := map[string]bool{}
		for _, id := range old.UnlockedAchievements {
			achievementSet[id] = true
		}
		for _, id := range p.UnlockedAchievements {
			achievementSet[id] = true
		}
		p.UnlockedAchievements = p.UnlockedAchievements[:0]
		for _, id := range []string{"boot_sequence", "first_blood", "scrap_hoarder", "floor_runner", "combo_starter", "clean_code", "first_boss", "tower_runner", "combo_master", "hard_mode", "untouchable", "marksman", "speedrunner", "rich_process", "hacker_mode", "hacker_veteran", "evasive_protocol", "perfect_run", "executioner", "tower_master", "full_stack", "boss_dance", "hacker_predator"} {
			if achievementSet[id] {
				p.UnlockedAchievements = append(p.UnlockedAchievements, id)
			}
		}
		if p.PerfectBossWins < old.PerfectBossWins {
			p.PerfectBossWins = old.PerfectBossWins
		}
		if p.BestAccuracy < old.BestAccuracy {
			p.BestAccuracy = old.BestAccuracy
		}
		if p.EnemyDodges < old.EnemyDodges {
			p.EnemyDodges = old.EnemyDodges
		}
		if p.BossDodges < old.BossDodges {
			p.BossDodges = old.BossDodges
		}
		if p.SelectedPet == "" {
			p.SelectedPet = old.SelectedPet
		}
		if p.CharacterColor == "" {
			p.CharacterColor = old.CharacterColor
		}
		store.Profiles[k] = p
		saveStoreLocked()
		store.mu.Unlock()
		withJSON(w)
		_ = json.NewEncoder(w).Encode(p)
	default:
		http.Error(w, "metodo no permitido", 405)
	}
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s (%s)", r.Method, r.URL.Path, time.Since(start))
	})
}
func main() {
	loadStore()
	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.Dir("./static")))
	mux.HandleFunc("/api/highscores", handleHighscores)
	mux.HandleFunc("/api/profile", handleProfile)
	addr := ":8080"
	log.Printf("Servidor corriendo en http://localhost%s", addr)
	if err := http.ListenAndServe(addr, loggingMiddleware(mux)); err != nil {
		log.Fatal(err)
	}
}
