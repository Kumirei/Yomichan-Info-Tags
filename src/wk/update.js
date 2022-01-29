const axios = require("axios");
const fs = require("fs");
require("dotenv").config();
const archiver = require("archiver");
const path = require("path");

const config = {
    headers: {
        Authorization: `Bearer ${process.env.WK_API_TOKEN}`,
    },
};

async function wait(time) {
    return new Promise((res, rej) => setTimeout(res, time));
}

async function getItems() {
    let items = [];
    let url = "https://api.wanikani.com/v2/subjects?page_after_id=0";
    while (url) {
        console.log(`Fetching ${url}`);
        let data = await axios.get(url, config);
        items = items.concat(data.data.data);
        url = data.data.pages.next_url;
        await wait(1000);
    }
    return items;
}

async function updateWKItems() {
    let items = await getItems();
    let kanji = items
        .filter((a) => a.object == "kanji" && a.data.hidden_at == null)
        .map((a) => `    ["${a.data.characters}", "freq", ${a.data.level}]`);
    let vocab = items
        .filter((a) => a.object == "vocabulary" && a.data.hidden_at == null)
        .map((a) => `["${a.data.characters}", "freq", ${a.data.level}]`);
    let kanjiText = `[\n${kanji.join(",\n")}\n]`;
    let vocabText = `[\n${vocab.join(",\n")}\n]`;

    const errorHandler = (err) => (err ? console.error(err) : undefined);

    fs.writeFile(`${__dirname}/kanji.json`, kanjiText, "utf-8", errorHandler);
    fs.writeFile(`${__dirname}/vocab.json`, vocabText, "utf-8", errorHandler);
}

function zip() {
    const output = fs.createWriteStream(
        path.join(__dirname, "../../dicts/yomichan_wk_level_tags.zip"),
    );
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(output);
    archive.file(`${__dirname}/index.json`, {
        name: "index.json",
    });
    archive.file(`${__dirname}/kanji.json`, {
        name: "kanji_meta_bank_1.json",
    });
    archive.file(`${__dirname}/vocab.json`, {
        name: "term_meta_bank_1.json",
    });
    archive.finalize();
}

async function main() {
    await updateWKItems();
    zip();
}

main();
