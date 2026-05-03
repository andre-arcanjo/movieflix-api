import express from 'express';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';

import swaggerDocument from '../swagger.json' with { type: 'json' };

import type { Request, Response, NextFunction } from 'express';

declare global {
    namespace Express {
        interface Request {
            id?: number;
        }
    }
}

const port = 3000;

const app = express();

const prisma = new PrismaClient();

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

function validateId(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ message: 'ID inválido' });
    }

    req.id = id;
    next();
}

const defaultInclude = {
    genres: true,
    languages: true,
};

app.get('/movies', async (_, res) => {
    
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: 'asc',
        },
        include: defaultInclude
    });
    res.json(movies);
});

app.get('/movies/id/:id', validateId, async (req, res) => {
    try {
        const id = Number(req.params.id);

        const movieFilteredById = await prisma.movie.findUnique({
            include: defaultInclude,
            where: {
                id,
            },
        });

        if (!movieFilteredById)
            return res.status(404).json({ message: 'Filme não encontrado.' });

        res.status(200).json(movieFilteredById);
    } catch (error) {
        return res
            .status(500)
            .json({ message: 'Falha ao buscar filme por id.' });
    }
});

app.get('/movies/genres/:genreName', async (req, res) => {
    try {
        const moviesFilteredByGenreName = await prisma.movie.findMany({
            orderBy: {
                title: 'asc',
            },
            include: defaultInclude,
            where: {
                genres: {
                    is: {
                        name: {
                            equals: req.params.genreName,
                            mode: 'insensitive',
                        },
                    },
                },
            },
        });

        if (moviesFilteredByGenreName.length === 0)
            return res
                .status(404)
                .json({ message: 'Nenhum filme foi encontrado.' });

        res.status(200).json(moviesFilteredByGenreName);
    } catch (error) {
        return res
            .status(500)
            .json({ message: 'Falha ao filtrar filmes por gênero.' });
    }
});

app.get('/movies/languages/:languageName', async (req, res) => {
    try {
        const moviesFilteredByLanguageName = await prisma.movie.findMany({
            orderBy: {
                title: 'asc',
            },
            include: defaultInclude,
            where: {
                languages: {
                    is: {
                        name: {
                            equals: req.params.languageName,
                            mode: 'insensitive',
                        },
                    },
                },
            },
        });

        if (moviesFilteredByLanguageName.length === 0)
            return res
                .status(404)
                .json({ message: 'Nenhum filme foi encontrado.' });

        res.status(200).json(moviesFilteredByLanguageName);
    } catch (error) {
        return res
            .status(500)
            .json({ message: 'Falha ao filtrar filmes por linguagem.' });
    }
});

app.post('/movies', async (req, res) => {
    const { title, genre_id, language_id, oscar_count, release_date } =
        req.body;

    try {
        const movieWithSameTitle = await prisma.movie.findFirst({
            where: { title: { equals: title, mode: 'insensitive' } },
        });

        if (movieWithSameTitle) {
            return res.status(409).json({
                message: 'Já existe um filme cadastrado com esse título',
            });
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
        return res.status(500).json({ message: 'Falha ao cadastrar filme.' });
    }

    res.status(201).json({ message: 'Filme cadastrado com sucesso.' });
});

app.put('/movies/:id', validateId, async (req, res) => {
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id,
            },
        });

        if (!movie) {
            return res.status(404).json({ message: 'Filme não encontrado.' });
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
            .json({ message: 'Falha ao atualizar o registro do filme.' });
    }

    res.status(200).json({ message: 'Filme alterado com sucesso.' });
});

app.delete('/movies/:id', validateId, async (req, res) => {
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id,
            },
        });

        if (!movie) {
            return res.status(404).json({ message: 'Filme não encontrado.' });
        }

        await prisma.movie.delete({
            where: {
                id,
            },
        });
        res.status(200).json({ message: 'Filme deletado com sucesso.' });
    } catch (error) {
        return res
            .status(500)
            .json({ message: 'Não foi possível deletar o filme.' });
    }
});

app.get('/genres', async (_, res) => {
    const genres = await prisma.genre.findMany({
        orderBy: {
            name: 'asc',
        },
    });
    res.json(genres);
});

app.post('/genres', async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res
            .status(400)
            .json({ message: 'O nome do gênero é obrigatório' });
    }

    try {
        const genreWithSameTitle = await prisma.genre.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } },
        });

        if (genreWithSameTitle) {
            return res.status(409).json({
                message: 'Já existe um gênero cadastrado com esse título',
            });
        }

        await prisma.genre.create({
            data: {
                name,
            },
        });
        res.status(201).json({ message: 'Gênero cadastrado com sucesso.' });
    } catch (error) {
        return res.status(500).json({ message: 'Falha ao cadastrar gênero.' });
    }
});

app.put('/genres/:id', validateId, async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        return res
            .status(400)
            .json({ message: 'O nome do gênero é obrigatório.' });
    }

    try {
        const genre = await prisma.genre.findUnique({
            where: { id: Number(id) },
        });

        if (!genre) {
            return res.status(404).json({ message: 'Gênero não encontrado.' });
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
                .json({ message: 'Este nome de gênero já existe.' });
        }

        const updatedGenre = await prisma.genre.update({
            where: { id: Number(id) },
            data: { name },
        });

        res.status(200).json({ message: 'Gênero alterado com sucesso.' });
    } catch (error) {
        res.status(500).json({
            message: 'Houve um problema ao atualizar o gênero.',
        });
    }
});

app.delete('/genres/:id', validateId, async (req, res) => {
    const id = Number(req.params.id);

    try {
        const genre = await prisma.genre.findUnique({
            where: {
                id,
            },
        });

        if (!genre)
            return res.status(404).json({ message: 'Gênero não encontrado.' });

        await prisma.genre.delete({
            where: {
                id,
            },
        });
        res.status(200).json({ message: 'Gênero excluído com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Falha ao excluir gênero.' });
    }
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
            .json({ message: 'O nome da linguagem é obrigatória' });
    }

    try {
        const languageWithSameTitle = await prisma.language.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } },
        });

        if (languageWithSameTitle) {
            return res.status(409).json({
                message: 'Já existe uma linguagem cadastrada com esse título.',
            });
        }

        await prisma.language.create({
            data: {
                name,
            },
        });
        res.status(201).json({ message: 'Linguagem cadastrada com sucesso.' });
    } catch (error) {
        return res
            .status(500)
            .json({ message: 'Falha ao cadastrar linguagem.' });
    }
});

app.put('/languages/:id',validateId, async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'Linguagem não encontrada' });
    }

    if (!name) {
        return res
            .status(400)
            .json({ message: 'O nome da linguagem é obrigatória.' });
    }

    try {
        const genre = await prisma.language.findUnique({
            where: { id: Number(id) },
        });

        if (!genre) {
            return res
                .status(404)
                .json({ message: 'Linguagem não encontrada.' });
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
                .json({ message: 'Este nome de linguagem já existe.' });
        }

        const updatedLanguage = await prisma.language.update({
            where: { id: Number(id) },
            data: { name },
        });

        res.status(200).json({ message: 'Linguagem alterada com sucesso.' });
    } catch (error) {
        res.status(500).json({
            message: 'Houve um problema ao atualizar a linguagem',
        });
    }
});

app.delete('/languages/:id', validateId, async (req, res) => {
    const id = Number(req.params.id);

    try {
        const language = await prisma.language.findUnique({
            where: {
                id,
            },
        });

        if (!language)
            return res
                .status(404)
                .json({ message: 'Linguagem não encontrada.' });

        await prisma.language.delete({
            where: {
                id,
            },
        });
        res.status(200).json({ message: 'Linguagem excluída com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Falha ao excluir linguagem.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor em execução em: http://localhost:${port}`);
});
