const txtWaitingBloods = document.getElementById('txtWaitingBloods')
const appRouter = function (app) {
  app.get("/", function(req, res) {
    res.status(200).send("Welcome to our restful API")
  })
  
  app.get("/setWatingBlood/:num", function (req, res) {
    const num = req.params.num
    txtWaitingBloods.innerText = num
    res.status(200).send(num)
  });
}
  
module.exports = appRouter;
  