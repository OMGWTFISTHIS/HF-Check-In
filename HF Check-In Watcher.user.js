// ==UserScript==
// @name        HF Check-In Watcher
// @author      +mK
// @namespace   https://github.com/OMGWTFISTHIS
// @version     1.1.1
// @description Alerts users of new HF Check-Ins (checks on /usercp.php)
// @require     https://code.jquery.com/jquery-3.1.1.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.js
// @require     https://cdn.jsdelivr.net/npm/js-cookie@2.2.1/src/js.cookie.js
// @match       *://hackforums.net/*
// @copyright   2016+
// @updateURL   https://github.com/OMGWTFISTHIS/HF-Check-In/raw/master/HF%20Check-In%20Watcher.user.js
// @downloadURL https://github.com/OMGWTFISTHIS/HF-Check-In/raw/master/HF%20Check-In%20Watcher.user.js
// @iconURL     https://github.com/OMGWTFISTHIS/HF-Check-In/raw/master/Check-In.png
// @grant       GM_getValue
// @grant       GM_setValue
// ==/UserScript==
// ------------------------------ Change Log ----------------------------
// version 1.1.1: Fixed Stanley's new and improved UID. Script should now be functioninng again.
// version 1.1.0: Check-in alert is now generated on any page you visit on Hack Forums, not just UserCP.
// version 1.0.1: Now checks for updates only once per 15 minutes, to reduce requests to server
// version 1.0.0: Initial Release
// ------------------------------ Dev Notes -----------------------------
//
// ------------------------------ SETTINGS ------------------------------
// User's threads: Checks what user's threads to watch
var ThreadsURL = "https://hackforums.net/search.php?action=finduserthreads&uid=1337";
// Filter Title: Filter unread thread results by keyword
var titleFilterBool = true; // (true = ON, false = OFF)
var titleFilter = "Check-In"; // seperate keywords by commas ex."PP,BTC"
// Debug: Show console.log statements for debugging purposes
var debug = true;
// Alert Note: Note at bottom of alert (note text goes between spans)
var alertNote = "<span id='alertCSS'></span>";
var alertNoteCSS = "<style>#alertCSS{color:red}</style>";
// ------------------------------ ON PAGE LOAD ------------------------------

// Limit calls
var inFifteenMinutes = new Date(new Date().getTime() + 15 * 60 * 1000);
// If cookie doesn't exist, create it
if (document.cookie.indexOf("cookieTimer") == -1) {
    Cookies.set('cookieTimer', 'Timer', {
       expires: inFifteenMinutes
    });
    if (debug) {
        console.log("This is the first time we've checked in fifteen minutes. Setting cookie.");
    }
        // Cookie variables
        var threadTitles = "";
        var showAlert = true;
        // Grab most recent Checkin thread title(s)
        $.ajax({
            url: ThreadsURL,
            cache: false,
            success: function(response) {
                // Static Variables
                var CheckinThreadName;
                var Today = moment().format('MMMM Do, YYYY').toString();
                var threadLinkArray = [];
                var threadTitleArray = [];
                var forumTitle;
                var count = 0;
                // Forum Title
                forumTitle = "Check-In";
                // Find correct table
                var tableArray = $(response).find(".tborder").toArray();
                var forumTable;
                for (i = 0; i < tableArray.length; i++) {
                    if (debug && !$(tableArray[i]).find("tbody").find("tr").find("td").find("div:eq(1)").find("strong").text())
                        console.log("Table Index " + i + ": " + $(tableArray[i]).find("tbody").find("tr").find("td").find("div:eq(1)").find("strong").text());
                    // Select correct table
                    forumTable = tableArray[i];
                }
                if (debug)
                    console.log(forumTable);
                // Break table into rows
                rows = $(forumTable).find("tbody tr").toArray();
                // Column with thread title & link
                // Loop through table rows
                var column2 = 'td:eq(1) div span a:eq(1)';
                var column1 = 'td:eq(0) span';
                for (i = 0; i < rows.length; i++) {
                    // Debug
                    if (debug)
                        console.log("Span SRC: " + $(rows[i]).find('td:eq(1)').find('div').find('span').find('a:eq(1)'));
                    // Find newewst thread
                    temp = $(rows[i]).find('td:eq(1)').find('td:eq(1)').find('div').find('span').find('a:eq(1)').find('innerHTML');
                    Dates = $(rows[i]).find(column2).text();
                    Postedcheck = $(rows[i]).find(column1).attr('title');
                    if (temp !== undefined && (Dates.includes(Today)) && Postedcheck.includes('posts by you') != true) {
                        threadLinkArray[count] = $(rows[i]).find(column2).attr('href');
                        threadTitleArray[count] = $(rows[i]).find(column2).text().replace(/["',]/g, ""); // Remove chars("',) from string
                        count++;
                    }
                }

                // Alert HTML Heading
                CheckinThreadName = "<strong class='.thead'><u>New Check-In Thread:</u></strong><br/>";
                var foundNewFilter = false;
                // Alert HTML Body
                for (i = 0; i < threadLinkArray.length; i++) {
                    // Title filter
                    if (titleFilterBool) {
                        // For loop for filters
                        var titleFilterArray = titleFilter.split(',');
                        for (j = 0; j < titleFilterArray.length; j++) {
                            if (threadTitleArray[i].includes(titleFilterArray[j])) {
                                foundNewFilter = true;
                                CheckinThreadName += "<a href='" + threadLinkArray[i] + "'>" + threadTitleArray[i] + "</a><br/>";
                                // Cookie string
                                threadTitles = threadTitles + threadTitleArray[i] + ",";
                            }
                        }
                    }
                    // No title filter
                    else {
                        CheckinThreadName += "<a href='" + threadLinkArray[i] + "'>" + threadTitleArray[i] + "</a><br/>";
                        // Cookie string
                        threadTitles = threadTitles + threadTitleArray[i] + ",";
                    }
                }

                // Cookie logic
                var addCookieAlert = "";
                // Make cookie if doesn't already exist
                if (document.cookie.replace(/(?:(?:^|.*;\s*)HFCWCookie\s*\=\s*([^;]*).*$)|^.*$/, "$1") === undefined)
                    document.cookie = 'HFCWCookie=';
                // Debug Cookie and Current thread titles
                if (debug) {
                    console.log("Cookie: '" + document.cookie.replace(/(?:(?:^|.*;\s*)HFCWCookie\s*\=\s*([^;]*).*$)|^.*$/, "$1") +
                        "'\nThread: '" + threadTitles + "'");
                    if (document.cookie.replace(/(?:(?:^|.*;\s*)HFCWCookie\s*\=\s*([^;]*).*$)|^.*$/, "$1") == threadTitles)
                        console.log("Titles Match: true");
                    else
                        console.log("Titles Match: false");
                }
                // Cookie title matches (Hide alert)
                if (document.cookie.replace(/(?:(?:^|.*;\s*)HFCWCookie\s*\=\s*([^;]*).*$)|^.*$/, "$1") == threadTitles)
                    showAlert = false;
                // No match (Inject HTML to show alert)
                else
                    addCookieAlert = "document.cookie = 'HFCWCookie=" + threadTitles + "'; $(\"Checkin_alert\").remove();";

                // Alert notice html
                var html = "<div class='pm_alert' id='Checkin_alert'><div class='float_right'><a href='javascript:closeAlert();'  title='Dismiss this notice'>" +
                    "<img src='https://hackforums.net/images/modern_bl/dismiss_notice.gif' style='cursor:pointer' alt='Dismiss this notice'  title='Dismiss'></a>" +
                    "</div><div></div></div><script>function closeAlert(){var confirmAlert = confirm('Dismiss alert? Doing so will hide it until new threads are found.');" +
                    " if(confirmAlert){" + addCookieAlert + "}}</script>";
                // Some fancy string insertion
                var substring = "</div><div>";
                var position = html.indexOf(substring) + (substring).length;
                CheckinThreadName += alertNote + alertNoteCSS;
                html = [html.slice(0, position), CheckinThreadName, html.slice(position)].join('');
                // If new threads (Filter and Found) => Append HTML
                // Runs if titles don't match
                if (showAlert) {
                    if (titleFilterBool && foundNewFilter)
                        $(html).insertBefore("#content");
                    // If new threads (all) => Append HTML
                    if (!titleFilterBool)
                        $(html).insertBefore("#content");
                }
                // Debug
                if (debug) {
                    console.log("rows: " + rows.length);
                    console.log("New Threads Found: " + threadLinkArray.length);
                    console.log("Alert HTML: " + CheckinThreadName);
                }
            }
        });
    }
else {
    // If cookie exists, wait
    if (debug) {
        console.log("A timer cookie is currently set to limit the amount of requests HF Check-In uses. Waiting until it has expired.")
    }
}
