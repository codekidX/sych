use std::{fs, path::Path, path::PathBuf};

use anyhow::{Ok, Result};
use indexmap::IndexMap;
use structopt::StructOpt;

use crate::transpiler::Doc;
use crate::SychConfig;

type IndexedBlockMap = IndexMap<String, Vec<markdown::Block>>;

static HBS_FILE: &str = include_str!("../templates/sych.hbs");
static SYCH_HBS_NAME: &str = "salt.hbs";

const SYCH_INIT_DATA: &str = r#"[meta]
title = "sych docs"
authors = ["sych_author"]
version = "0.1.0"
description = "sych generates docs from .md files in your project"
"#;

const SYCH_TOML: &str = "sych.toml";
const SYCH_HTML: &str = ".sych.html";

#[derive(StructOpt, Debug)]
#[structopt(name = "sych", about = "A very fast document site generator")]
pub struct SychCLI {
    #[structopt(
        long,
        help = "change the root folder for generating docs",
        value_name = "ROOT_FOLDER"
    )]
    pub root: Option<PathBuf>,

    #[structopt(short, long, help = "creates sych.toml in the current directory")]
    pub init: bool,

    #[structopt(long, help = "don't open the docs in web browser, just rebuild")]
    pub noopen: bool,

    #[structopt(long, short, help = "generate a minified html for publishing")]
    pub release: bool,
}

impl SychCLI {
    pub fn load() -> Self {
        Self::from_args()
    }

    pub fn execute(&self) -> Result<()> {
        let mut root = get_cwd()?;
        let config_path = root.join(SYCH_TOML);

        // intializes sych.toml with default configurations
        // SYCH_INIT_DATA is the defualt content
        if self.init {
            return initialize(&config_path);
        }

        // check if sych config is initialized in the directory
        // from which user is running the 'sych' command
        if !config_path.exists() {
            return Err(anyhow::Error::msg("not a sych project. do 'sych -i' ..."));
        }

        // read sych.toml inside the current working directory
        let mut sych_cfg = toml::from_str::<SychConfig>(&fs::read_to_string(&config_path)?)?;
        // validate_config(&sych_cfg)?;

        // if user has mentioned custom root folder use that!
        // we give precedence to whatever is passed through
        // CLI
        if let Some(user_root) = self.root.as_ref() {
            // TODO: some colorized output
            root = user_root.clone();
            println!("using root: {}", root.to_str().unwrap());
        } else if let Some(doc_config) = sych_cfg.doc.as_ref() {
            if let Some(config_root) = doc_config.root.as_ref() {
                root = PathBuf::from(config_root);
                println!("using root: {}", root.to_str().unwrap());
            }
        }

        // start finding markdown files recursively inside "root"
        let markdown_files: Vec<String> = rust_search::SearchBuilder::default()
            .location(root.as_path())
            .ext("md")
            .build()
            .collect();

        let mut docs_index: IndexedBlockMap = IndexMap::new();
        // index and combine the markdown file content into a single
        // Vec<> of markdown blocks
        index_markdown_files(&sych_cfg, &markdown_files, &mut docs_index)?;

        // transpile markdown files into valid HTML
        // render and create .sych.html file
        let doc_path = root.join(SYCH_HTML);
        save_html(&sych_cfg, &doc_path, docs_index, self.release)?;

        // convert the absolute path to relative path for
        // expansion on other user's machine
        if self.noopen {
            return update_references_in_cfg(&mut sych_cfg, &root, &config_path, &markdown_files);
        }

        // open file in default web browser
        return webbrowser::open_browser(webbrowser::Browser::Default, doc_path.to_str().unwrap())
            .map_err(anyhow::Error::from);
    }
}

fn update_references_in_cfg(
    sych_cfg: &mut SychConfig,
    root: &Path,
    config_path: &PathBuf,
    markdown_files: &[String],
) -> Result<()> {
    let root_path_str = root.to_str().unwrap();
    sych_cfg.refs = Some(
        markdown_files
            .iter()
            .map(|f| f.replace(root_path_str, "."))
            .collect(),
    );
    let updated_sych_cfg = toml::to_string_pretty(&sych_cfg)?;
    std::fs::write(config_path, updated_sych_cfg).map_err(anyhow::Error::from)
}

fn index_markdown_files(
    sych_cfg: &SychConfig,
    markdown_files: &[String],
    docs_index: &mut IndexedBlockMap,
) -> Result<()> {
    'md_loop: for md_file_path in markdown_files {
        if let Some(doc) = sych_cfg.doc.as_ref() {
            if let Some(exclude) = doc.exclude.as_ref() {
                for search_path in exclude {
                    if md_file_path.contains(search_path) {
                        break 'md_loop;
                    }
                }
            }
        }

        let md_content = std::fs::read_to_string(md_file_path)?;
        // convert markdown content to vec of markdown::Block
        let tokens = markdown::tokenize(&md_content);
        // index all markdown files to convert into sections
        // all Header2 tags will be converted to section headers on the left
        // and all content between the Header2 will be the children of
        // corresponding section
        super::indexer::create_index(tokens, docs_index);
    }

    Ok(())
}

fn save_html(
    sych_cfg: &SychConfig,
    doc_path: &PathBuf,
    docs_index: IndexedBlockMap,
    is_release: bool,
) -> Result<()> {
    let mut reg = handlebars::Handlebars::new();
    reg.register_template_string(SYCH_HBS_NAME, HBS_FILE)?;

    let mut html = reg.render(SYCH_HBS_NAME, &Doc::generate(sych_cfg, docs_index))?;
    if is_release {
        let mut cfg = minify_html::Cfg::spec_compliant();
        cfg.minify_js = true;
        cfg.minify_css = true;
        let minified_bytes = minify_html::minify(html.as_bytes(), &cfg);
        html = std::str::from_utf8(&minified_bytes)
            .map_err(|e| anyhow::Error::msg(e.to_string()))?
            .to_owned();
    }
    std::fs::write(doc_path, html).map_err(anyhow::Error::from)
}

fn initialize(cwd: &PathBuf) -> Result<()> {
    std::fs::write(cwd, SYCH_INIT_DATA).map_err(anyhow::Error::from)
}

fn get_cwd() -> Result<PathBuf> {
    std::env::current_dir().map_err(anyhow::Error::from)
}

/// acts as a gatekeeper for verifying the extensions provided by the users
fn _validate_config(sych_cfg: &SychConfig) -> Result<()> {
    if let Some(extensions) = sych_cfg.extensions.as_ref() {
        for ext in extensions.values() {
            if !ext.url.starts_with("https://ext.sych.com")
                || !ext.url.starts_with("http://ext.sych.com")
                || !ext.url.starts_with("ext.sych.com")
                || !ext.url.starts_with("http://localhost:8000")
            {
                return Err(anyhow::Error::msg(format!(
                    "invalid {}. cannot use unknown extensions.",
                    ext.url
                )));
            }
        }
    }

    Ok(())
}
