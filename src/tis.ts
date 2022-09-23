import {exec as execSync} from "child_process";
import util from "util";

const exec = util.promisify(execSync);

const infoRegex = /Tag count: (?<tag_count>.*)\s*File count: (?<file_count>.*)\s*Tags: (?<tag_list>.*)/;

export async function callTIS(args: string[]): Promise<string> {
    const {stdout, stderr} = await exec(`./tis ${args.join(" ")}`);

    if (stderr)
        throw new Error(stderr);

    return stdout.trim();
}

export async function getRandom() {
    return await callTIS(["random"]);
}

export async function getImages(tags: string[], exclude?: string[], exclusive?: boolean, exclusiveExclude?: boolean, limit?: number) {
    const formattedTags = tags.map(tag => tag.trim().toLowerCase()).join(";");
    const args = ["list", `"${formattedTags}"`];

    let excluded = 0;

    if (exclusive)
        args.push("--exclusive");

    const result = await callTIS(args);
    let files = [...new Set(result.split(", "))];

    if (exclude && exclude.length > 0) {
        const formattedExclude = exclude.map(tag => tag.trim().toLowerCase()).join(";");
        const excludeArgs = ["list", `"${formattedExclude}"`];
        if (exclusiveExclude)
            excludeArgs.push("--exclusive");
        const excludeResult = await callTIS(excludeArgs);
        const excludeFiles = [...new Set(excludeResult.split(", "))];
        const lenBefore = files.length;
        files = files.filter(file => !excludeFiles.includes(file));
        excluded = lenBefore - files.length;
    }

    if (!limit)
        limit = 1;
    else if (limit > 10)
        limit = 10;
    else if (limit < 1)
        limit = 1;

    const randomFiles = [];
    for (let i = 0; i < limit; i++) {
        if (files.length === 0)
            break;

        const index = Math.floor(Math.random() * files.length);
        randomFiles.push(files[index]);
        files.splice(index, 1);
    }

    return {
        files: randomFiles,
        excluded,
    };
}

export async function getInfo() {
    const result = await callTIS(["info"]);
    const match = result.match(infoRegex);

    const {tag_count, file_count, tag_list} = match!.groups as {tag_count: string, file_count: string, tag_list: string};
    return {
        tag_count: parseInt(tag_count),
        file_count: parseInt(file_count),
        tag_list: tag_list.split(", ").map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0),
    };
}
