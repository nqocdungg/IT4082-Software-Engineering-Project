import express from 'express'

const app = express()
const PORT = process.env.PORT || 5050

app.get('/', (req,res) => {
    res.send("Server is running");
})
app.listen(PORT, () => {
    console.log(`Server has started on port: ${PORT}`)
})