const express = require('express');
require('dotenv').config();
const syncRouter = require('./routes/sync');

const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const {createQueueMQ} =require('./queue');
const app = express();
const PORT = 3000;

// queue
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/queue');
app.use('/queue', serverAdapter.getRouter());

// queue channels
const calenderEvents = createQueueMQ('calenderEvents');

createBullBoard({
    queues: [new BullMQAdapter(calenderEvents)],
    serverAdapter,
  });



app.get('/',(req,res)=>{
    return res.json({
        "hello":"world"
    });
    
});

app.use('/calendar',syncRouter);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
