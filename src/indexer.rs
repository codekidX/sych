use indexmap;
use markdown::Block;

pub(crate) fn create_index(
    blocks: Vec<Block>,
    docs_index: &mut indexmap::IndexMap<String, Vec<Block>>,
) {
    let mut doc_section = String::new();
    // println!("Values: {:?}", blocks);
    for block in blocks {
        match block {
            Block::OrderedList(li, li_type) => {
                if !doc_section.is_empty() {
                    docs_index
                        .entry(doc_section.clone())
                        .and_modify(|e| e.push(Block::OrderedList(li, li_type)));
                    continue;
                }
            }
            Block::CodeBlock(copt, code) => {
                if !doc_section.is_empty() {
                    docs_index
                        .entry(doc_section.clone())
                        .and_modify(|e| e.push(Block::CodeBlock(copt, code)));
                    continue;
                }
            }
            Block::Paragraph(pspans) => {
                if !doc_section.is_empty() {
                    docs_index
                        .entry(doc_section.clone())
                        .and_modify(|e| e.push(Block::Paragraph(pspans.clone())));
                    continue;
                }
                continue;
            }
            Block::Header(h, hsize) => {
                // println!("header : {h:?}");

                if hsize == 1_usize {
                    continue;
                }

                // TODO: check this part
                if hsize == 2_usize && h.len() != 1 {
                    return;
                }
                if !doc_section.is_empty() && hsize > 2_usize {
                    docs_index
                        .entry(doc_section.clone())
                        .and_modify(|e| e.push(Block::Header(h.clone(), hsize)));
                    continue;
                }
                if hsize == 2_usize {
                    if let Some(header) = h.first() {
                        match header {
                            markdown::Span::Text(t) => {
                                doc_section = t.to_owned();
                                docs_index.entry(t.to_owned()).or_insert(Vec::new());
                            }
                            _ => {
                                return;
                            }
                        }
                    }
                    continue;
                }
            }
            Block::Blockquote(bq) => {
                if !doc_section.is_empty() {
                    docs_index
                        .entry(doc_section.clone())
                        .and_modify(|e| e.push(Block::Blockquote(bq)));
                    continue;
                }
            }
            Block::UnorderedList(items) => {
                if !doc_section.is_empty() {
                    docs_index
                        .entry(doc_section.clone())
                        .and_modify(|e| e.push(Block::UnorderedList(items)));
                    continue;
                }
            }
            _ => continue,
        }
    }
}
