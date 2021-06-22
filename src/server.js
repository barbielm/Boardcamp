import express from 'express';
import cors from 'cors';
import pg from 'pg';
import Joi from 'joi';

const server = express();
server.use(cors());
server.use(express.json());

const {Pool} = pg;

const connection = new Pool({
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp'
});

const categoriesSchema = Joi.object({
    name: Joi.string().required()
})


server.get('/categories', async (req,res) => {
    const categories = await connection.query('SELECT * FROM categories');
    res.send(categories.rows);
    console.log(categories.rows);
})

server.post('/categories', async (req,res) => {
    const {error} = categoriesSchema.validate(req.body);
    if(!error){
        const categoriesNames = await connection.query("SELECT * FROM categories");
        if(categoriesNames.rows.length !== 0){
            for(let i = 0; i < categoriesNames.rows.length; i++){
                if(categoriesNames.rows[i].name === req.body.name){
                    res.sendStatus(409);
                    return;
                }
            }
        }
        try {
            const insertNewCategorie = await connection.query("INSERT INTO categories(name) VALUES ($1)",[req.body.name]);
            res.sendStatus(201);
        } catch {
            res.sendStatus(500);
        }

    } else {
        res.sendStatus(400);
    }
    
})

server.listen(4000);