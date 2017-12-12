var Nightmare = require("nightmare");
var fs = require("fs");
var path = require("path");

getPhase0Archive(...process.argv.slice(2));

async function getPhase0Archive(email, password, courseId) {
  var dir = path.resolve(process.cwd(), "phase-0-archive");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  var nightmare = Nightmare({ show: false });
  var modules = await nightmare
    .goto(`https://devbootcamp.instructure.com/courses/${courseId}/modules`)
    .type("#username", email)
    .type("#password", password)
    .click("button.button")
    .wait("#context_modules")
    .evaluate(() =>
      Array.from(document.getElementById("context_modules").children).reduce(
        (result, weekNode, weeknum) =>
          result.concat(
            Array.from(weekNode.querySelectorAll(".module-item-title a")).map(
              (lesson, i) => ({
                name: lesson.innerText.trim(),
                week: weeknum,
                href: lesson.href,
                lesson: i
              })
            )
          ),
        []
      )
    );
  while (modules.length > 0) {
    const { name, week, href, lesson } = modules.shift();
    if (/devbootcamp\.instructure\.com/.test(href)) {
      var folder = path.resolve(dir, "week-" + week);
      if (!fs.existsSync(folder)) fs.mkdirSync(folder);
      var filename = path.resolve(folder, `Lesson ${lesson} - ${name}.pdf`);
      console.log("Loading pdf for ", filename);
      await nightmare
        .goto(href)
        .wait("#content")
        .pdf(filename);
    }
  }
  nightmare.end();
}
