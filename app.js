// To import modules.
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

// Module Configration
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// To connect MongoDB with database.
mongoose.connect("mongodb+srv://admin-kdyash:Test%40214365@cluster0.ny8uejd.mongodb.net/todolistDB");
// To export date from date.js module. 
const day = date.getDate();

// Schema and Collection for main task list.
const itemScheme = new mongoose.Schema({
  name:{
    type: String,
    required: true
  }
});

const Item = mongoose.model("Item", itemScheme);

// Schema and collection for custom lists.
const customListSchema = new mongoose.Schema({
  name: String,
  items: [itemScheme]
});

const List = mongoose.model("List", customListSchema);

// Demo tasks.
const task1 = new Item({
  name:"Welcome to your to-do-list"
});

const task2 = new Item({
  name:"Hit checkbox to delete task"
});

const task3 = new Item({
  name:"press '+' to add new task"
});

const defaultTask = [task1, task2, task3];

// Get method :
app.get("/", function(req, res) {

  Item.find(function(err, items){
    if (items.length === 0) {
      Item.insertMany(defaultTask, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully added.");
        }
      });
      res.redirect("/");

    } else {
      res.render("list", {listTitle: day, newListItems: items});
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

// For getting and creating new custom list.
app.get("/:customListName", function(req, res){

  const listName = _.lowerCase(req.params.customListName);
  
  List.findOne({name: listName}, function(err, searchList){

    if (!err){ //if err doesn't found      (! = did not)

      if(!searchList){ // if searchList doesn't found or match, create new list.
        const newList = new List({
          name: listName,
          items: defaultTask
        });
        newList.save();

        //res.render("list", {listTitle: newList.name, newListItems: newList.items});
        res.redirect("/"+listName);

      } else {
        res.render("list", {listTitle: _.capitalize(searchList.name), newListItems: searchList.items});
      }
    }
  });
});

// Post method :
app.post("/", function(req, res){

  const customListPostName = req.body.list;

  const newItems = new Item({
    name:req.body.newItem
  });

  if (customListPostName === day){
    newItems.save();
    res.redirect("/");

  } else {

    const lowercaseListName = _.lowerCase(customListPostName);

    List.findOne({name: lowercaseListName}, function(err, foundList){ //foundlist === customListPostName
      foundList.items.push(newItems);
      foundList.save();
      res.redirect("/"+ lowercaseListName);
    });
  }
});

// To delete task when its checked.
app.post("/delete", function(req, res){

  const checkedListName = req.body.checkedListName;
  const checkboxId = req.body.checkBox;

  if (checkedListName === day){

    Item.deleteOne({_id:checkboxId}, function(err){
      if (err){
        console.log(err);
      } else {
        res.redirect("/");
      }
    })
  } else {

    const lowerCaseListName = _.lowerCase(req.body.checkedListName);

    List.findOneAndUpdate({name: lowerCaseListName}, {$pull: {items: {_id: checkboxId}}}, function(err, foundList){
      if (!err){
        res.redirect("/"+ lowerCaseListName);
      }
    });
  }
});

// Port.
app.listen(3000, function() {
  console.log("Server has started succesfully.");
});
