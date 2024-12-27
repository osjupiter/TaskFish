use chrono::{DateTime, Utc};
use rand::distributions::{Distribution, Uniform};
use serde::{Deserialize, Serialize};

// src-tauri/src/main.rs
use std::sync::Mutex;
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Quest {
    id: String,
    title: String,
    description: String,
    reward_points: i32,
    reward_resources: Resources,
    completed: bool,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Resources {
    gold: i32,
    experience: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Power {
    from_seconds: i64,
    power: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct PlayerState {
    level: i32,
    points: i32,
    points_per_second: f32,
    resources: Resources,
    active_quests: Vec<Quest>,
    completed_quests: Vec<Quest>,
    start_at: DateTime<Utc>,
    last_update: DateTime<Utc>,
    upgrade_times: Vec<Power>,
}

struct AppState {
    player: Mutex<PlayerState>,
}

#[tauri::command]
async fn get_player_state(state: State<'_, AppState>) -> Result<PlayerState, String> {
    let player = state
        .player
        .lock()
        .map_err(|_| "Failed to lock player state")?;
    Ok(player.clone())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .manage(AppState {
            player: Mutex::new(PlayerState {
                level: 1,
                points: 0,
                points_per_second: 1.0,
                resources: Resources {
                    gold: 0,
                    experience: 0,
                },
                active_quests: Vec::new(),
                completed_quests: Vec::new(),
                start_at: Utc::now(),
                last_update: Utc::now(),
                upgrade_times: vec![ Power { from_seconds: 0, power: 1 } ],
            }),
        })
        .invoke_handler(tauri::generate_handler![
            get_player_state,
            add_quest,
            complete_quest,
            reorder_quests,
            update_quest,
            upgrade_points_per_second,
            success_fish
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn add_quest(
    title: String,
    description: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut player = state
        .player
        .lock()
        .map_err(|_| "Failed to lock player state")?;
    let normal = Uniform::new(60, 120);
    let mut rng = rand::thread_rng();
    let gold = normal.sample(&mut rng) as i32;

    let quest = Quest {
        id: Uuid::new_v4().to_string(),
        title,
        description,
        reward_points: 10,
        reward_resources: Resources {
            gold,
            experience: 0,
        },
        completed: false,
        created_at: Utc::now(),
    };

    player.active_quests.push(quest);
    Ok(())
}

#[tauri::command]
async fn complete_quest(quest_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut player = state
        .player
        .lock()
        .map_err(|_| "Failed to lock player state")?;

    if let Some(quest_index) = player.active_quests.iter().position(|q| q.id == quest_id) {
        let mut quest = player.active_quests.remove(quest_index);
        quest.completed = true;

        // Add rewards
        player.resources.gold += quest.reward_resources.gold;

        // Level up check
        player.level = (player.resources.experience as f32 / 1000.0).floor() as i32 + 1;

        player.completed_quests.push(quest);
    }

    Ok(())
}

#[tauri::command]
async fn success_fish( state: State<'_, AppState>) -> Result<(), String> {
    let mut player = state
        .player
        .lock()
        .map_err(|_| "Failed to lock player state")?;

        // Add rewards
        player.resources.gold += 10;

    Ok(())
}

#[tauri::command]
async fn reorder_quests(quest_ids: Vec<String>, state: State<'_, AppState>) -> Result<(), String> {
    let mut player = state
        .player
        .lock()
        .map_err(|_| "Failed to lock player state")?;
    let mut new_quests = Vec::new();
    for id in quest_ids {
        if let Some(quest) = player.active_quests.iter().find(|q| q.id == id) {
            new_quests.push(quest.clone());
        }
    }

    player.active_quests = new_quests;

    Ok(())
}

#[tauri::command]
async fn update_quest(
    quest_id: String,
    title: String,
    description: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut player = state
        .player
        .lock()
        .map_err(|_| "Failed to lock player state")?;
    if let Some(quest) = player.active_quests.iter_mut().find(|q| q.id == quest_id) {
        quest.title = title;
        quest.description = description;
    }
    Ok(())
}

#[tauri::command]
async fn upgrade_points_per_second(state: State<'_, AppState>) -> Result<(), String> {
    let mut player = state
        .player
        .lock()
        .map_err(|_| "Failed to lock player state")?;

    if player.resources.gold >= 200 {
        player.resources.gold -= 200;
        let diffseconds = Utc::now().timestamp() - player.start_at.timestamp();
        player.upgrade_times.push(Power {
            from_seconds: diffseconds,
            power: 5,
        });
    }
    player.last_update = Utc::now();

    Ok(())
}
