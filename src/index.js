import http from 'node:http';
import { closeDatabase, initializeDatabase } from './database.js';
import { createDraftAndSave, listPosts } from './services/post-service.js';
import { parseJsonBody, sendJson } from './utils/http.js';

const { API_PORT = 3000, API_HOST = 'localhost', API_PROTOCOL = 'http' } = process.env;

const server = http.createServer(async (request, response) => {
	const { method, url } = request;
	const [path] = (url || '/').split('?');

	if (path === '/') {
		return sendJson(response, 200, { message: 'Hello World' });
	}

	if (method === 'GET' && path === '/posts') {
		try {
			const posts = await listPosts();
			return sendJson(response, 200, { data: posts });
		} catch (error) {
			console.error('Error listing posts:', error);
			return sendJson(response, 500, { message: 'Could not list posts' });
		}
	}

	if (method === 'POST' && ['/posts/draft', '/posts/drafts'].includes(path)) {
		let body;

		try {
			body = await parseJsonBody(request);
		} catch (error) {
			console.error('Error parsing request body:', error);
			return sendJson(response, 400, { message: 'Invalid JSON' });
		}

		const { idea } = body;

		if (!idea) {
			return sendJson(response, 400, { message: 'Idea is required' });
		}

		try {
			const post = await createDraftAndSave(idea);
			return sendJson(response, 201, { data: post });
		} catch (error) {
			console.error('Error generating post draft:', error);
			return sendJson(response, 500, { message: 'Could not generate post' });
		}
	}

	return sendJson(response, 404, { message: 'Not Found' });
});

async function shutdown(signal) {
	console.log(`\nReceived ${signal}. Shutting down gracefully...`);
	server.close(async () => {
		try {
			await closeDatabase();
			console.log('Database connections closed.');
			process.exit(0);
		} catch (error) {
			console.error('Error closing database connections:', error);
			process.exit(1);
		}
	});
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

initializeDatabase()
	.then(() => {
		server.listen(API_PORT, API_HOST, () => {
			console.log(`Server is running on ${API_PROTOCOL}://${API_HOST}:${API_PORT}`);
			console.log('Press Ctrl+C to stop the server');
		});
	})
	.catch((error) => {
		console.error('Could not initialize database:', error.message || error);
		process.exit(1);
	});
