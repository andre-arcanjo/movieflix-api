import express from 'express';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';

import swaggerDocument from '../swagger.json' with { type: 'json' };

const port = 3000;

const app = express();

const prisma = new PrismaClient();

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/movies', async (_, res) => {
    const movies = await prisma.movie.findMany({
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
        const movieWithSameTitle = await prisma.movie.findFirst({
            where: { title: { equals: title, mode: 'insensitive' } },
        });

        if (movieWithSameTitle) {
            return res
                .status(409)
                .send('Já existe um filme cadastrado com esse título');
        }

        await prisma.movie.create({
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

app.put('/movies/:id', async (req, res) => {
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id,
            },
        });

        if (!movie) {
            return res.status(404).send({ message: 'Filme não encontrado' });
        }

        const data = { ...req.body };
        data.release_date = data.release_date
            ? new Date(data.release_date)
            : undefined;

        await prisma.movie.update({
            where: {
                id,
            },
            data: data,
        });
    } catch (error) {
        return res
            .status(500)
            .send({ message: 'Falha ao atualizar o registro do filme' });
    }

    res.status(200).send();
});

app.delete('/movies/:id', async (req, res) => {
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id,
            },
        });

        if (!movie) {
            return res.status(404).send({ message: 'Filme não encontrado' });
        }

        await prisma.movie.delete({
            where: {
                id,
            },
        });
    } catch (error) {
        return res
            .status(500)
            .send({ message: 'Não foi possível remover o filme' });
    }

    res.status(200).send();
});

app.get('/movies/:genreName', async (req, res) => {
    try {
        const moviesFilteredGenreName = await prisma.movie.findMany({
            orderBy: {
                title: 'asc',
            },
            include: {
                genres: true,
                languages: true,
            },
            where: {
                genres: {
                    name: {
                        equals: req.params.genreName,
                        mode: 'insensitive',
                    },
                },
            },
        });
        res.status(200).send(moviesFilteredGenreName);
    } catch (error) {
        return res
            .status(500)
            .send({ message: 'Falha ao filtrar filmes por gênero' });
    }
});

app.put('/genres/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!id) {
        return res.status(400).send({ message: 'Gênero não encontrado' });
    }

    if (!name) {
        return res
            .status(400)
            .send({ message: 'O nome do gênero é obrigatório.' });
    }

    try {
        const genre = await prisma.genre.findUnique({
            where: { id: Number(id) },
        });

        if (!genre) {
            return res.status(404).send({ message: 'Gênero não encontrado' });
        }

        const existingGenre = await prisma.genre.findFirst({
            where: {
                name: { equals: name, mode: 'insensitive' },
                id: { not: Number(id) },
            },
        });

        if (existingGenre) {
            return res
                .status(409)
                .send({ message: 'Este nome de gênero já existe.' });
        }

        const updatedGenre = await prisma.genre.update({
            where: { id: Number(id) },
            data: { name },
        });

        res.status(200).json(updatedGenre);
    } catch (error) {
        res.status(500).send({
            message: 'Houve um problema ao atualizar o gênero',
        });
    }
});

app.post('/genres', async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res
            .status(400)
            .send({ message: 'O nome do gênero é obrigatório' });
    }

    try {
        const genreWithSameTitle = await prisma.genre.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } },
        });

        if (genreWithSameTitle) {
            return res
                .status(409)
                .send('Já existe um gênero cadastrado com esse título');
        }

        await prisma.genre.create({
            data: {
                name,
            },
        });
    } catch (error) {
        return res.status(500).send({ message: 'Falha ao cadastrar gênero' });
    }

    res.status(201).send();
});

app.get('/genres', async (_, res) => {
    const genres = await prisma.genre.findMany({
        orderBy: {
            name: 'asc',
        },
    });
    res.json(genres);
});

app.delete('/genres/:id', async (req, res) => {
    const id = Number(req.params.id);

    try {
        const genre = await prisma.genre.findUnique({
            where: {
                id,
            }
        })

        if (!genre) return res.status(404).send({ message: 'Gênero não encontrado' });

        await prisma.genre.delete({
            where: {
                id,
            }
        })
        
    }catch(error){
        res.status(500).send({message: "Falha ao excluir gênero"})
    }

    res.status(200).send({message: "Filme excluído com sucesso"})
});

app.get('/languages', async (_, res) => {
    const language = await prisma.language.findMany({
        orderBy: {
            name: 'asc',
        },
    });
    res.json(language);
});

app.post('/languages', async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res
            .status(400)
            .send({ message: 'O nome da linguagem é obrigatória' });
    }

    try {
        const languageWithSameTitle = await prisma.language.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } },
        });

        if (languageWithSameTitle) {
            return res
                .status(409)
                .send('Já existe uma linguagem cadastrado com esse título');
        }

        await prisma.language.create({
            data: {
                name,
            },
        });
    } catch (error) {
        return res.status(500).send({ message: 'Falha ao cadastrar linguagem' });
    }

    res.status(201).send({message: "Linguagem cadastrada com sucesso"});
});

app.put('/languages/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!id) {
        return res.status(400).send({ message: 'Linguagem não encontrada' });
    }

    if (!name) {
        return res
            .status(400)
            .send({ message: 'O nome da linguagem é obrigatória.' });
    }

    try {
        const genre = await prisma.language.findUnique({
            where: { id: Number(id) },
        });

        if (!genre) {
            return res.status(404).send({ message: 'Linguagem não encontrado' });
        }

        const existingLanguage = await prisma.language.findFirst({
            where: {
                name: { equals: name, mode: 'insensitive' },
                id: { not: Number(id) },
            },
        });

        if (existingLanguage) {
            return res
                .status(409)
                .send({ message: 'Este nome de linguagem já existe.' });
        }

        const updatedLanguage = await prisma.language.update({
            where: { id: Number(id) },
            data: { name },
        });

        res.status(200).json(updatedLanguage);
    } catch (error) {
        res.status(500).send({
            message: 'Houve um problema ao atualizar a linguagem',
        });
    }
});

app.listen(port, () => {
    console.log(`Servidor em execução em: http://localhost:${port}`);
});
