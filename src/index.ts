import fastify from 'fastify';
import {getImages, getInfo, getRandom} from "./tis.js";

const server = fastify({
    ignoreTrailingSlash: true,
    ignoreDuplicateSlashes: true,
});
await server.register(import("@fastify/cors"), { origin: "*" });
await server.register(import('@fastify/compress'));

server.get('/', async (_request, _reply) => {
    return {
        message: "Welcome to ecchi.cloud, the best hentai API you'll find!",
        routes: {
            "GET /": "This page",
            "GET /api/info": "Get basic info such as the number of tags and files, and a list of all tags available",
            "GET /api/random": "Get a random hentai image",
            "POST /api": {
                "title": "Get images by tags with optional settings",
                "body": {
                    "tags": "String[]: Array of tags to search for",
                    "exclude": "String[]: Array of tags to exclude from the search",
                    "exclusive": "Boolean: only return images with all tags (default: true), if false, will return images with any of the tags",
                    "limit": "Int: Number of images to return (default: 1, max: 10)",
                },
            },
        }
    };
});

server.get('/api/info', async (_req, res) => {
    try {
        const result = await getInfo();
        return res.send(result);
    } catch (err) {
        console.error(err);
        return res.status(500).send({error: "Internal server error"});
    }
});

server.get('/api/random', async (_req, res) => {
    try {
        const file = await getRandom();
        return res.send({
            file: `https://cdn.ecchi.cloud/${file}`,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send({error: "Internal Server Error"});
    }
});

server.post('/api', async (req, res) => {
    try {
        const {tags, exclude, exclusive, limit} = req.body as any;

        if (!tags || !Array.isArray(tags) || tags.length === 0 || tags.some(tag => typeof tag !== "string")) {
            return res.status(400).send({error: "Bad Request, tags must be an array of strings with at least one tag"});
        }

        if (exclude && (!Array.isArray(exclude) || exclude.some(tag => typeof tag !== "string"))) {
            return res.status(400).send({error: "Bad Request, exclude must be an array of strings"});
        }

        if (exclusive && typeof exclusive !== "boolean") {
            return res.status(400).send({error: "Bad Request, exclusive must be a boolean"});
        }

        if (limit && typeof limit !== "number") {
            return res.status(400).send({error: "Bad Request, limit must be a number"});
        }

        const files = await getImages(tags, exclude, exclusive, limit);
        return res.send({
            files: files.map(file => `https://cdn.ecchi.cloud/${file}`),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send({error: "Internal Server Error"});
    }
});

const address = await server.listen({
    port: 80,
    host: '0.0.0.0',
}).catch((err) => {
    console.error(err);
    process.exit(1);
});

console.log(`Server listening on ${address}`);
