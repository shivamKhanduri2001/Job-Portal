const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwetoken');

exports. register = async (req, res) => {
    const { name, email, password, role } = req.body;}
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    };

    try{
        const hassedPassword = await bcrypt.hash(password, 10);
        const user = await pool.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *', [name, email, hassedPassword, role]
        );
        const token = jet.sign (
            { id : user.rows[0].id},
            "secretkey",
            { expiresIn: '1h' }
        );
        res.status(201).json({ token, user });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    };

exports.login = async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.lenght === 0) {
            return res.status(400).json({error : "User not found"});
        }
        const valid = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!valid) {
            return res.status(400).json({error : "Invalid password"});
        }
        const token = jwt.sign(
            { id : user.rows[0].id},
            "secretkey",
            { expiresIn: '1h' }
        );
        res.json({ token, user });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}