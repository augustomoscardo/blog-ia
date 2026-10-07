import http from 'node:http';
import { createPostDraft } from './services/post-service.js';

const {  API_PORT, API_HOST, API_PROTOCOL } = process.env;

const posts = [
	{ id: 1, title: 'Primeiro post', content: 'Conteúdo do primeiro post.' },
	{ id: 2, title: 'Segundo post', content: 'Conteúdo do segundo post.' },
];

const server = http.createServer((request, response) => {
	const { method, url } = request;
	const paths = url.split('?').filter(Boolean);
	const path = paths.at(0) || '/';

	response.setHeader('Content-Type', 'application/json');

	if (path === '/') {
		return response.end(JSON.stringify({ message: 'Hello World' }));
	}

	if (method === 'GET' && path === '/posts') {
		return response.end(JSON.stringify({ data: posts }));
	}

	if (method === 'POST' && path === '/posts/draft') {
		const body = [];

		request.on('data', (chunk) => {
			body.push(chunk);
		});

		request.on('end', async () => {
			let requestBody;

			try {
				requestBody = JSON.parse(Buffer.concat(body).toString());
			} catch {
				response.statusCode = 400;
				return response.end(JSON.stringify({ message: 'Invalid JSON' }));
			}

			const { idea } = requestBody;

			if (!idea) {
				response.statusCode = 400;
				return response.end(JSON.stringify({ message: 'Idea is required' }));
			}

			try {
				const post = await createPostDraft(idea);
				posts.push(post);
				response.statusCode = 201;
				return response.end(JSON.stringify({ data: post }));
			} catch {
				response.statusCode = 500;
				return response.end(JSON.stringify({ message: 'Could not generate post' }));
			}
		});

		return;
	}

	response.statusCode = 404;
	response.end(JSON.stringify({ message: 'Not Found' }));
});

server.listen(API_PORT, API_HOST, () => {
  console.log(`Server is running on ${API_PROTOCOL}://${API_HOST}:${API_PORT}`);
	console.log("Press Ctrl+C to stop the server");
	
});
