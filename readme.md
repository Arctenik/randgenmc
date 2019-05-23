An app for making (semi-) random text generators in Minecraft. This is mainly for instructions on how to create generators, so there's some other info in the [Planet Minecraft post](https://www.planetminecraft.com/mod/text-generation-using-functions/).

Generators can be created as plain text files written in a simple language (inspired by [RandomGen](http://orteil.dashnet.org/randomgen/)). This example shows everything that the language can do:

```
$color
red
purple
blue

$thing
balloon
cake
shirt

$statement
My favorite color is [color].
I have a [color] [thing].
```

- A generator consists of one or more lists.
- To make a list, write the list's name with a dollar sign in front of it, and then write one list item on each line following the name.
- When the generator is run, it will give you a random item from the final list in the generator file.
- Within a list item, you can insert a random item from another list by enclosing that list's name in square brackets -- for example, `[thing]` gives you a random item from the list named "thing".

In that example generator, there are three lists - "color", "thing", and "statement". The generator will produce items from the "statement" list, which will be things like "My favorite color is purple." and "I have a blue shirt."

The only other thing you might need to know is the you can prefix any character with a backslash to make that character appear as written; for example `\[brackets\]` will appear as "[brackets]" in the generator output. Another notable place where this is useful is when you want to put a space at the beginning or end of a list item.

<<<<<<< HEAD
Generator files can be converted to .mcfunction files using this page: https://arctenik.github.io/randgenmc/
=======
Generator files can be converted to .mcfunction files for Minecraft 1.12 using this page: https://zatnik.github.io/randgenmc/
>>>>>>> origin/master

The converter can provide generators as either tellraw messages or as `give` commands for written books; be careful with the books, though, because you have to open the book before generating anything else in order for it to work.

To use the generator, take the folder with the name you had in the converter's "Namespace" input and put in in your world's "functions" folder. Then you can open the world and use the command `/function <function name>` (the converter will tell you what the `<function name>` is).
