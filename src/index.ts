import Fastify from 'fastify';

const server = Fastify();
await server.register(import("@fastify/cors"), { origin: "*" });
await server.register(import('@fastify/compress'));

server.get('/', async (_request, _reply) => {
    return { hello: 'world' };
});

server.get('/api/random', async (_request, _reply) => {
    return { random: Math.random() };
});

const address = await server.listen({
    port: 80,
    host: '0.0.0.0',
}).catch((err) => {
    console.error(err);
    process.exit(1);
});

console.log(`Server listening on ${address}`);
