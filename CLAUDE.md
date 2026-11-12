We prefer python flask app.
We will be using my libraries dld.py for interfacing with the db and static/m.js for javascript.
We don't like using objects or classes unless we have to.
We don't like catching exceptions - we prefer errors to be reported to log files or the browser console.
We prefer fetch/then to await.
We use a functional style using map, reduce, filter.
We really don't like single use variables - use big structures and anonymous functions passed directly.
We are not afraid of deep nesting - we use two characters for indentation.
We use css files rather than inline styles.
In CSS, each declaration gets its own line.
We like short code.
We avoid blank lines and we keep opening brace on the same line as the statement.
We allow a single blank line between function definitions.
In HTML, script tags go in the head with the defer attribute.
We put the functionality into javascript - python is used for little else than CRUD actions with the db - use JSON, use camelCase table and column names from the db.
We don't send redundant or denormalised data - if a value can be looked up or joined, we don't duplicate it in another column or embed it in JSON.
We use standard SQL and avoid vendor-specific syntax where practical; we avoid synthetic primary keys
