use serde::{Deserialize, Serialize};

mod cli;
mod indexer;
mod transpiler;

#[derive(Serialize, Deserialize, Debug)]
struct Doc {
    pub root: Option<String>,
    pub exclude: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Meta {
    pub title: String,
    pub authors: Vec<String>,
    pub version: String,
    pub description: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct SychConfig {
    pub meta: Meta,
    pub doc: Option<Doc>,
    pub refs: Option<Vec<String>>,
}

fn main() {
    if let Err(e) = cli::execute() {
        eprintln!("error: {}", e);
        std::process::exit(1);
    }
}
