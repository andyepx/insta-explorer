const server = http.createServer();
server.listen(0);
server.on('listening', function () {
    const port = server.address().port;
    console.log(port);
});