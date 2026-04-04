import express from 'express';
import { PrismaClient } from './generated/prisma/index.js';

const port = 3000;

const app = express();

const prisma = new PrismaClient();

app.use(express.json());

app.get('/movies', async (_, res) => {
    const movies = await prisma.movies.findMany({
        orderBy: {
            title: 'asc',
        },
        include: {
            genres: true,
            languages: true,
        },
    });
    res.json(movies);
});

app.post('/movies', async (req, res) => {
    const { title, genre_id, language_id, oscar_count, release_date } =
        req.body;

    try {
        const movieWithSameTitle = await prisma.movies.findFirst({
            where: { title: { equals: title, mode: "insensitive" } },
        });

        if (movieWithSameTitle) {
            return res.status(409).send('Já existe um filme cadastrado com esse título');
        }

        await prisma.movies.create({
            data: {
                title: title,
                genre_id,
                language_id,
                oscar_count,
                release_date: new Date(release_date),
            },
        });
    } catch (error) {
        return res.status(500).send({ message: 'Falha ao cadastrar filme' });
    }

    res.status(201).send();
});

app.listen(port, () => {
    console.log(`Servidor em execução em: http://localhost:${port}`);
});