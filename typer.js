function typer(el, speed) {
  var q = []; // The main array to contain all the methods called on typer.
  parentDataNum(); // Assign a random # to the parent el's data attribute.

  // List of HTML void elements (http://goo.gl/SWmyS5),
  // used in 'processMsg' & 'processBack'.
  q.voids = ['area','base','br','col','command','embed','hr','img','input','keygen','link','meta','param','source','track','wbr'];

  // Various checks.
  speed = speed || 70;
  var jQuery = jQuery || function(){}; // jQuery check.
  if(el.length) el = el[0]; // Test for jQuery objects.
  if(!document.styleSheets.length) styleSheets(); // Create a stylesheet if none exist.


  // Public methods.
  var typerObj = {
    cursor: function(cursorObj) {
      // Prevent errors from no arguments.
      if(cursorObj === undefined) cursorObj = true;

      // Prevent cursor from being run multiple times.
      if(q.cursorRan) {
        console.log('You can only call .cursor once.');
        return this;
      }

      q.cursorRan = true;

      // No cursor.
      if(cursorObj === false) {
        q.cursor = 'no-cursor';
        return this;
      }

      var cursor = [];
      var data = '[data-typer="' + q.dataNum + '"]';

      // Optional cursor color - https://goo.gl/8k2mqL
      if(cursorObj.color) {
        document.styleSheets[0].addRule(data + ' .typer:after', 'background-color:' + cursorObj.color + ';');
      }

      // Cursor's blinking style - default to soft.
      cursorObj.blink === 'hard' ? cursor.push('cursor-hard') : cursor.push('cursor-soft');

      // Cursor: block or line.
      if(cursorObj.block === true) cursor.push('cursor-block');

      q.cursor = cursor.join(' ');

      return this;
    },
    line: function(msg, spd, html) {
      if(!msg) {
        q.push({line: 1});
      } else {
        q.push(lineOrContinue('line', msg, spd, html));
      }

      // Push the first dominoe on the typing iteration,
      // ensuring 'processq()' can only be run once.
      if(!q.typing) {
        q.typing = true;
        processq();
      }

      return this;
    },
    continue: function(msg, spd, html) {
      if(!msg) return this; // Skip empty continues.
      q.push(lineOrContinue('continue', msg, spd, html));
      return this;
    },
    pause: function(num) {
      // Default to 500 milliseconds.
      if(num === undefined) num = 500;

      q.push({pause: num});
      return this;
    },
    emit: function(event, el) {
      if(!el) el = document.body // If no el is given. default to the body.
      if(el instanceof jQuery) el = el[0];
      if(!el.nodeType || el.nodeType !== 1) throw '.emit() error: invalid element provided.';

      q.push({emit: event, el: el});
      return this;
    },
    listen: function(event, el) {
      if(!el) el = document.body;
      if(el instanceof jQuery) el = el[0];
      if(!el.nodeType || el.nodeType !== 1) throw '.listen() error: invalid element provided.';

      q.push({listen: event, el: el});
      return this;
    },
    back: function(chars, spd) {
      q.push({back: chars, speed: spd});
      return this;
    },
    empty: function() {
      q.push({empty: true});
      return this;
    },
    run: function(fxn) {
      q.push({run: fxn});
      return this;
    },
    end: function(fxn, e) {
      q.push({end: true});

      q.cb = function() {
        // Finalize the the div class names before ending.
        q.newDiv.className = 'white-space';
        var classes = q.newDiv.dataset.class;
        if(classes) q.newDiv.className += ' ' + classes;
        q.newDiv = '';

        if(fxn && typeof fxn === 'function') fxn(el);
        if((fxn && typeof fxn === 'boolean') || e) {
          if(typeof e === 'function') e(el);
          var fin = new Event('typerFinished');
          document.body.dispatchEvent(fin);
        }
      }

      // A convenient object to warn the user if they
      // try to call any methods after '.end'.
      var catchAll = {
        cursor: function() {
          return message();
        },
        line: function() {
          return message();
        },
        continue: function() {
          return message();
        },
        pause: function() {
          return message();
        },
        emit: function() {
          return message();
        },
        listen: function() {
          return message();
        },
        back: function() {
          return message();
        },
        empty: function() {
          return message();
        },
        run: function() {
          return message();
        },
        end: function() {
          return message();
        }
      };

      // Message used by the 'catchAll' object.
      function message() {
        console.log('WARNING: you tried to call a method after ".end" has already been called.');
        return catchAll;
      }

      return catchAll;
    }
  };

  // Private functions.
  function parentDataNum() {
    // Random # function with min & max values.
    // function randomNum(min, max) {
    //   return Math.floor(Math.random() * (max - min + 1) + min);
    // }
    q.dataNum = Math.floor(Math.random() * 999999999 + 1);
    el.dataset.typer = q.dataNum;
  }
  function styleSheets() { // https://goo.gl/b4Ckz9
    // Create the style element.
    var style = document.createElement('style');

    // Webkit hack.
    style.appendChild(document.createTextNode(''));

    // Append the style element to the head.
    document.head.appendChild(style);
  }
  function lineOrContinue(choice, msg, spd, html) {
    var item = {};
    item.html = true; // Default status. Will be possibly overwritten below.

    function htmlObj(obj) {
      for(var i in obj) item[i] = obj[i];
    }

    // POSSIBLE ARRANGEMENTS:
    //  1. msg = string/array
    //  2. msg = string/array, spd
    //  3. msg = string/array, html
    //  4. msg = string/array, spd, html
    //  5. msg = string/array, html, spd
    //  6. msg = div
    //  7. msg = div, spd
    //  8. msg = div, html
    //  9. msg = div, spd, html
    // 10. msg = div, html, spd
    if(typeof msg === 'string' || msg.constructor.name === 'Array') {
      item[choice] = msg; // 1
    } else {
      if(msg.length) msg = msg[0]; // Test for jQuery objects.
      item[choice] = msg.innerHTML; // 6
    }

    if(spd && typeof spd === 'number') {
      item.speed = spd; // 2, 7
      if(html) htmlObj(html); // 4, 9
    } else if(spd) {
      htmlObj(spd); // 3, 8
      if(html) item.speed = html; // 5, 10
    }

    return item;
  }
  function processq() { // Begin our main iterator.
    if(!(q.item >= 0)) q.item = 0;
    if(q.item === q.length) document.body.removeEventListener('killTyper', q.kill);

    // If no cursor is declared, resort to default styling.
    // The cursor will be pinged later by each line.
    if(!q.cursor) q.cursor = 'cursor-soft';

    // Main iterator.
    q.type = setInterval(function() {
      var currentItem = q[q.item];

      // If we arrive here and we've exausted the q...
      if(q.item === q.length) return clearInterval(q.type); // Stop the main iterator.

      // Various processing functions.
      if(currentItem.line) processLine(currentItem);
      if(currentItem.continue) processContinue(currentItem);
      if(currentItem.pause) processPause(currentItem);
      if(currentItem.emit) processEmit(currentItem);
      if(currentItem.listen) processListen(currentItem);
      if(currentItem.back) processBack(currentItem);
      if(currentItem.empty) processEmpty();
      if(currentItem.run) processRun(currentItem);
      if(currentItem.end) processEnd(currentItem);
    }, 0);
  }
  function processMsg(item) { // Used by 'processLine' & 'processContinue'.
    var msg;
    item.line ? msg = item.line : msg = item.continue;

    var targetList = [q.newDiv];
    var counter = 0;
    q.iterator = setInterval(function() {
      // End of message processing logic.
      if(counter === msg.length) {
        clearInterval(q.iterator);
        q.item++; // Increment our main item counter.
        return processq(); // Restart the main iterator.
      }

      var piece = msg[counter];

      // NO HTML
      if(!item.html) {

        // Avoid HTML parsing on supplied arrays.
        if(typeof msg !== 'string') {
          var div = document.createElement('div');
          div.textContent = piece;
          piece = div.innerHTML;
        }

        q.newDiv.innerHTML += piece;

      // HTML
      } else {
        // Open tags.
        if(piece === '<' && msg[counter + 1] !== '/') {
          var tag = '';
          var voidTag = '';
          for(var i = counter; i < msg.length; i++) {
            tag += msg[i];
            if(msg[i] !== '>' && msg[i] !== '<') voidTag += msg[i];
            if(msg[i] === '>') break;
          }

          var isVoid = q.voids.some(function(v) {
            return v === voidTag;
          });

          // Non-void elements get focused on as the typing target.
          if(!isVoid) {
            var div = document.createElement('div');
            div.innerHTML = tag;

            var length = tag.length;
            var parent = targetList[0];
            targetList.unshift(div.firstChild); // Add current tag to beginning of the 'targetList' array.
            parent.appendChild(div.firstChild);

          // Void elements get added to the contents but are not focused on for typing.
          } else {
            targetList[0].innerHTML += tag;
          }

          return counter += tag.length; // Move the counter passed the current tag.

        // Closing tags.
        } else if(piece === '<' && msg[counter + 1] === '/') {
          targetList.shift(); // Remove the tag from the 'targetList' array.
          return counter = msg.indexOf('>', counter) + 1; // Move the counter passed the closing tag.

        // Unicode characters.
        } else if(piece === '&') {
          // 1. Build the unicode character.
          var char = '';
          for(var i = counter; i < msg.length; i++) {
            char += msg[i];
            if(msg[i] === ';') break;
          }

          // 2. Test the unicode character.
          var div = document.createElement('div');
          div.innerHTML = char;
          if(div.textContent.length === 1) { // Unicode's will convert to HTML with a length of 1.
            targetList[0].innerHTML += char;
            counter = i; // Move the counter to the end of the unicode text.
          } else {
            targetList[0].innerHTML += piece;
          }
        } else {
          targetList[0].innerHTML += piece;
        }
      }

      counter++;
    }, item.speed || speed); // Function for both line and continue.
  }
  function processLine(item) {
    // Stop the main iterator.
    clearInterval(q.type);

    // Process the previous line if there was one.
    if(q.newDiv) {
      q.newDiv.className = '';
      var userClass = q.newDiv.dataset.class;
      if(userClass) q.newDiv.className = userClass;

      q.newDiv.classList.add('white-space');
      if(q.newDiv.innerHTML === '') q.newDiv.innerHTML = ' '; // Retains the height of a single line.
    }

    // Create new div.
    var div = document.createElement('div');
    div.dataset.typerChild = q.dataNum;
    div.className = q.cursor;
    div.classList.add('typer', 'white-space');

    if(item.class) { // User-provided additional classes.
      div.className += (' ' + item.class);
      div.dataset.class = item.class;
    }

    el.appendChild(div);
    q.newDiv = div;

    // If our line has no contents...
    if(item.line === 1) {
      q.item++;
      return processq();
    }

    // Message iterator.
    processMsg(item);
  }
  function processContinue(item) {
    clearInterval(q.type); // Stop the main iterator.
    processMsg(item); // Message iterator.
  }
  function processPause(item) {
    clearInterval(q.type); // Stop the main iterator.

    q.pause = setTimeout(function() {
      q.item++; // Increment our main item counter.
      processq(); // Restart the main iterator.
    }, item.pause);
  }
  function processEmit(item) {
    clearInterval(q.type); // Stop the main iterator.

    var e = new Event(item.emit);
    item.el.dispatchEvent(e);

    q.item++;
    processq();
  }
  function processListen(item) {
    clearInterval(q.type); // Stop the main iterator.

    // One-time event listener.
    item.el.addEventListener(item.listen, function handler(e) {
      item.el.removeEventListener(e.type, handler)
      if(q.killed) return; // Prevent error if kill switch is engaged.
      q.item++;
      processq();
    });
  }
  function processBack(item) {
    // Stop the main iterator.
    clearInterval(q.type);

    // Check for being called on an empty line.
    if(!q.newDiv.textContent) {
      q.item++;
      return processq();
    }

    function removeEmptys(el) {
      // Convert HTMLcollection to an array: http://goo.gl/2rTC4i
      var children = [].slice.call(el.children);

      children.map(function(child, i) {
        // Child.
        if(!child.innerHTML.length) {
          child.remove();

          if(el === q.newDiv) {
            contents = el.innerHTML.split(''); // Reset the contents array.
            index = contents.length - 1; // Reset the index.
          }

        // Children of child.
        } else if(child.children.length) {
          removeEmptys(child); // Recursion (read: inception).

          if(!this[i].innerHTML.length) {
            this[i].remove(); // Remove empty recursive parent.
            contents = el.innerHTML.split('');
            index = contents.length - 1;
          }
        }
      }, children);
    }

    // Prevent '0' from triggering Typer's default speed.
    item.speed = item.speed || 1;

    // Empty the line all at once.
    if(item.back === 'empty') {
      q.newDiv.innerHTML = '';
      q.item++;
      return processq();
    }

    // Prevent larger 'back' quantities from needlessly interrupting the flow.
    if(item.back > q.newDiv.innerHTML.length) item.back = 'all';

    // A simple way to erase the whole line without knowing the contents:
    // set the # of 'backspaces' to the content's length.
    if(item.back === 'all') item.back = q.newDiv.textContent.length;

    // Negative #'s are an easy way to say "erase all BUT X-amount of characters."
    if(item.back < 0) {
      var text = q.newDiv.textContent;
      item.back = text.substring(item.back * -1, text.length).length;
    }

    var counter = 0;
    var contents = q.newDiv.innerHTML.split('');
    var index = contents.length - 1;

    q.goBack = setInterval(function() {
      counter++;

      // TAG DETECTION
      if(contents[index] === '>') {
        var tag = [];

        for(var i = index; i >= 0; i--) {
          tag.unshift(contents[i]);

          // Closing tag check.
          if(contents[i] === '<' && contents[i + 1] === '/') {
            tag.length = 0; // Clear the tag array.

            // Back-to-back-tags logic.
            if(contents[i - 1] === '>') {
              continue;
            } else {
              index = i - 1;
              break;
            }

          // Void tag check.
          } else if(contents[i] === '<') {
            var vTag = tag.slice(1, tag.length - 1).join('');
            var isVoid = q.voids.some(function(v) {
              return v === vTag;
            });

            index = i - 1;

            // Remove void tag.
            if(isVoid) contents.splice(i, tag.length);
            tag.length = 0;

            // Back-to-back-tags logic.
            if(contents[i - 1] === '>') {
              continue;
            } else {
              break;
            }
          }
        }
      }

      // UNICODE DETECTION
      if(contents[index] === ';') {
        var uni = [];

        for(var j = index; j >= 0; j--) {
          uni.unshift(contents[j]);
          if(contents[j] === '&') break;
        }

        var div = document.createElement('div');
        div.innerHTML = uni.join('');

        if(div.textContent.length === 1) {
          index = j - 1;
          // Remove the whole chunk.
          contents.splice(j, uni.length);
        } else {
          // Remove a single character.
          contents.splice(index, 1);
          index--;
        }

        q.newDiv.innerHTML = contents.join('');

      // DEFAULT SINGLE-CHARACTER REMOVAL
      } else {
        contents.splice(index, 1);
        q.newDiv.innerHTML = contents.join('');
        index--;
      }

      // Exit.
      if(counter === item.back) {
        clearInterval(q.goBack);
        removeEmptys(q.newDiv);
        q.item++;
        processq();
      }

    }, item.speed || speed);
  }
  function processEmpty() {
    q.newDiv = '';
    el.innerHTML = '';
    processLine({line: 1}); // This will stop the main iterator & run 'processq'.
  }
  function processRun(item) {
    clearInterval(q.type); // Stop the main iterator.

    item.run(el);
    q.item++;
    processq();
  }
  function processEnd() {
    clearInterval(q.type); // Final stop to our main iterator.
    q.cb(); // Run the callback provided.
  }

  // The kill switch.
  +function killSwitch() {
    q.kill = function(e) {
      document.body.removeEventListener(e.type, q.kill);
      q.killed = true; // For processListen.

      // Stop all iterations & pauses.
      clearInterval(q.iterator); // From processMsg.
      clearInterval(q.goBack); // From processBack.
      clearTimeout(q.pause) // From processPause.

      if(q.item === q.length) return console.log('This typer has completed; removing listener.');

      // If typer is in a listener state...
      var ear = q[q.item];
      if(ear.listen) {
        var name = new Event(ear.listen);
        ear.el.dispatchEvent(name);
      }

      console.log('Typer killed!');
    }
    document.body.addEventListener('killTyper', q.kill);
  }();

  // Return 'typerObj' to be able to run the various methods.
  return typerObj;
}