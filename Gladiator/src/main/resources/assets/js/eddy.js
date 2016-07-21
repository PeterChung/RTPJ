/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
if (!window.console) (function(b){function c(){}
    for(var d=["error","info","log","warn"],a;a=d.pop();)b[a]=b[a]||c})
(window.console=window.console={});

if (typeof Eddy === "undefined") Eddy = {};
(function() {

/**
 * These are our default Eddy.Tracker options.
 */
var DEFAULT_OPTIONS = {
    baseURL: "./",
    lastURI: "history-last.jsonp",
    hash: false
};

Eddy.Tracker = function(options) {
    if (!Modernizr.svgclippaths || !Modernizr.fontface) {
        location.href = "sorry.html";
        return null;
    }

    // apply option defaults
    this.options = _.defaults(options || {}, DEFAULT_OPTIONS);

    var body = $("body").detect();
    if (body.hasClass("ios")) {
        // stuff here
    }

    this.filters = new Eddy.Model.FilterList();
    this.timeline = new Eddy.Model.Timeline();
    this.photos = new Eddy.Model.TweetList();
    this.users = new Eddy.Model.UserList();

    if (this.options.timeline) {
        this.timeline.ui = new Eddy.UI.Timeline(this, this.options.timeline);
        this.timeline.ui.bind("change", function(time, index) {
            // console.log("timeline change:", [time, index]);
            this.filters.setIndex(index);
            this.users.setTime(time);
            // TODO: this.photos.setTime(time);
        }, this);
    }

    // create the loader
    this.loader = new Eddy.Loader(options.baseURL, options.lastURI);
    this.loader.bind("load", function(data) {
        this.update(data);
    }, this);

    // FIXME: only load Hot Seat data in the view?
    this.users.loader = new Eddy.Loader(options.baseURL, "hotseat-last.jsonp");
    this.users.loader.bind("load", function(data) {
        this.update(data, "users");
    }, this);

    this.photos.loader = new Eddy.Loader(options.baseURL, "retweets-last.jsonp");
    this.photos.loader.bind("load", function(data) {
        this.update(data, "photos");
    }, this);

    // FIXME: bring back Paparazzi loader?

    this.views = this.options.views || {};

    this.$container = $(this.options.container);
    this.$container.bind("click", _.bind(function(e) {
        this.hideHelp("fast");
    }, this));

    this.help = $(this.options.help);
    this.help.find(".close").bind("click", _.bind(function(e) {
        this.hideHelp("fast");
        e.preventDefault();
        return false;
    }, this));

    if (this.options.hash) {
        $(window).bind("hashchange", _.bind(this.onHashChange, this))
            .trigger("hashchange");
    }
};

_.extend(Eddy.Tracker.prototype, Backbone.Events, {
    loader: null,
    filters: null,
    timeline: null,
    typeData: {},

    update: function(data, what) {
        if (data === this._data) {
            console.info("[Tracker] update (trigger only):", data);
            if (this.filters._data) this.filters.trigger("update");
            if (this.timeline._data) this.timeline.trigger("update");
            if (this.photos._data) this.photos.trigger("update");
            if (this.users._data) this.users.trigger("update");
        } else {
            // console.info("[Tracker] update:", data);
            if (data.filters) {
                this.filters.update(data);
                this.filters._data = data;
            }
            if (data.history) {
                this.timeline.update(data);
                this.timeline._data = data;
            }
            if (data.tweets && what == "photos") {
                this.photos.update(data);
                this.photos._data = data;
            }
            if (data.tweets && what == "users") {
                this.users.update(data);
                this.users._data = data;
            }
        }
        this.trigger("update", data);
        this._data = data;
    },

    registerView: function(href, view) {
        this.views[href] = view;
    },

    unregisterView: function(href) {
        delete this.views[href];
        if (this.currentView && this.currentView.id == href) {
            this.setView(null);
        }
    },

    onHashChange: function(e) {
        var fragment = $.param.fragment(),
            parts = fragment.split("?"),
            href = parts[0],
            params = parts.length == 2
                ? $.deparam.querystring(parts[1])
                : {};

        if (this.currentView && this.currentView.id == href) {
            console.log("setParams():", JSON.stringify(params));
            this.currentView.setParams(params);

        } else {
            this.setView(href, params);
        }

        var time = params.time;
        if (time && this.timeline.ui) {
            time = (time == "now")
                ? new Date() / 1000
                : parseInt(time);
            if (!isNaN(time)) {
                this.timeline.ui.selectTime(time);
            }
        }
    },

    currentView: null,
    views: {},

    showHelp: function(speed) {
        clearTimeout(this.hideHelpTimeout);
        return this.help.slideDown(speed || "fast");
    },
    hideHelp: function(speed) {
        clearTimeout(this.hideHelpTimeout);
        return this.help.slideUp(speed || "slow");
    },
    hideHelpTimeout: null,
    hideHelpAfter: function(ms) {
        if (ms > 0) {
            clearTimeout(this.hideHelpTimeout);
            this.hideHelpTimeout = setTimeout(_.bind(this.hideHelp, this), ms);
        } else {
            this.hideHelp();
        }
    },

    setView: function(href, params) {
        var body = $("body").attr("id", null);
        if (this.currentView) {
            body.removeClass("deep");
            $("#nav-" + this.currentView.id).removeClass("selected");
            this.currentView.detach();
            this.currentView = null;
        }

        if (href in this.views) {

            console.warn("+ view for:", href, this.views[href]);

            if (typeof this.views[href] == "object") {
                this.currentView = this.views[href];
            } else if (typeof this.views[href] == "function") {
                var constructor = this.views[href];
                this.currentView = new constructor(this);
            }

            if (this.currentView) {
                body.attr("id", href).addClass("deep");
                $("#nav-" + href).addClass("selected");

                this.showHelp();
                this.hideHelpAfter(5000);

                this.currentView.id = href;
                this.currentView.attach(this.options.container);
                if (this._data) {
                    this.update(this._data);
                }
                if (params) this.currentView.setParams(params);
            }
            return this.currentView;

        } else {
            this.showHelp();
            console.warn("no view for:", href);
            return null;
        }
    },

    start: function() {
        this.loader.start(null, true);
        if (this.users.loader) this.users.loader.start(null, true);
        if (this.photos.loader) this.photos.loader.start(null, true);
    },

    stop: function(message) {
        this.loader.stop(message);
        if (this.users.loader) this.users.loader.stop(message);
        if (this.photos.loader) this.photos.loader.stop(message);
    }
});

Eddy.Model = {};

Eddy.Model.BackfillObject = Backbone.Model.extend({
    backfilling: false,
    backfill: function(attrs, seconds, previous) {
        clearInterval(this.backfillInterval);

        var time = 0,
            step = 100,
            end = seconds * 1000,
            steps = end / step,
            values = {};
        for (var i = attrs.length - 1; i >= 0; i--) {
            var attr = attrs[i],
                value = this.get(attr);
            if (value > 0) {
                var dummy = {},
                    start = previous
                        ? previous.get(attr)
                        : 0;
                dummy["current_" + attr] = start;
                this.set(dummy);
                values[attr] = (value - start) / steps;
            }
        }

        this.backfilling = true;
        return this.backfillInterval = setInterval(_.bind(function() {
            var updates = {};
            for (var attr in values) {
                var current = this.get("current_" + attr);
                updates["current_" + attr] = current + values[attr];
            }
            this.set(updates);
            if ((time += step) > end) {
                this.stopBackfilling();
            }
        }, this), step);
    },
    stopBackfilling: function() {
        clearInterval(this.backfillInterval);
        this.backfilling = false;
    }
});

Eddy.Model.BackfillObject.extend = Backbone.Model.extend;

/**
 * Tweets
 */
Eddy.Model.Tweet = Backbone.Model.extend({
    defaults: {
        "id":               null, // tweet GUID
        "user":             null, // "kanyewest"
        "user_icon":        null, // URL to icon
        "text":             null, // tweet text
        "time":             null, // UNIX timestamp
        "photo_url":        null, // fully qualified photo URL (expanded from short URL)
        "retweet_total":    0, // total retweet count
        "retweet_counts":   [], // per-time-sample retweet totals
        "place_history":    [], // per-time-sample hashes of place -> count
        "place_totals":     {}, // per-place counts
    },

    getPlaceTotal: function(place) {
        return this.attributes.place_totals[place] || 0;
    },

    getPlaceCounts: function(index) {
        var h = this.attributes.place_history;
        return (h && (index in h))
            ? h[index]
            : {};
    },
    getPlaceCount: function(loc, index) {
        return this.getPlaceCounts(index)[loc] || 0;
    }
});

/**
 * Tweeters
 */
Eddy.Model.User = Backbone.Model.extend({
    defaults: {
        "id":               null, // twitter handle, "kanyewest"
        "name":             null, // "Kanye West"
        "seat":             null, // "AA220"
        "photo_url":        null, // URL to photo (XXX: twitter icon?)
        "tweets":           [],
        "retweet_total":    0, // total retweet count
        "retweet_counts":   [] // per-time-sample retweet totals
    }
});

/**
 * Eddy Filter
 */
Eddy.Model.Filter = Backbone.Model.extend({
    defaults: {
        "name":     null,
        "tags":     [],
        "hashtag":  null,
        "term":     null,
        "tweets":   [],
        "photo_url": null,
        "total":    0,
        "last":     0,
        "recent":   0,
        "xlr":      0,
        "history":  [],
        "totals":   [],
        "deltas":   [],
        "munged":   false,
        "rank": 0
    }
});
Eddy.Model.Filter.PHOTO_URL_TEMPLATE = "images/small/{id}.jpg";

/**
 * Point in time on the timeline
 */
Eddy.Model.Checkpoint = Eddy.Model.BackfillObject.extend({
    defaults: {
        "time":             0,
        "date":             null,
        "count":            0,
        "total":            0,
        "running_total":    0
    }
});

/**
 * Period in time
 */
Eddy.Model.Timeframe = Backbone.Model.extend({
    defaults: {
        "label": "",
        "count": 0,
        "start_time": 0,
        "end_time": 0,
        "start_date": null,
        "end_date": null,
        "steps": 0,
        "period": 0,
        // goal stuff
        "goal": 0,
        "progress": 0,
        "complete": false
    },

    update: function() {
        var start = this.get("start_time"),
            period = this.get("period"),
            steps = this.get("steps"),
            end = this.get("end_time"),
            goal = this.get("goal"),
            count = this.get("count"),
            progress = goal ? count / goal : 0;
        if (!end && period && steps) {
            end = start + steps * period;
            // console.log(this.get("id"), start, period, steps, end);
        } else {
            // console.warn(this.get("id"), period, steps);
        }
        var attrs = {
            "start_date": new Date(start * 1000),
            "progress": progress,
            "complete": progress >= 1
        };
        if (end) {
            attrs.end_time = end;
            attrs.end_date = new Date(end * 1000);
            attrs.duration = end - start;
        }
        this.set(attrs);
        return this;
    },

    getTimeAt: function(index) {
        return this.get("start_time") + index * this.get("period");
    },
    getDateAt: function(index) {
        return new Date(this.getTimeAt(index) * 1000);
    },
    getTimeStep: function(time) {
        return ~~((time - this.get("start_time")) / this.get("period"));
    },
    getDateStep: function(date) {
        return this.getTimeStep(+date / 1000);
    },

    getTimeProgress: function(time) {
        return this.getTimeStep(time) / (this.get("steps") - 1);
    }
});

/**
 * This is our basic collection class, with convenience methods for merging in
 * data from lists of other things.
 */
Eddy.Model.ObjectList = Backbone.Collection.extend({
    getId: function(obj) {
        return obj.id;
    },

    munge: function(obj) {
        return obj;
    },

    merge: function(objects) {
        var len = objects.length,
            added = 0,
            updated = 0,
            removed = 0;

        var oldIds = {},
            newIds = {};
        this.models.forEach(function(obj) {
            oldIds[obj.id] = obj;
        });

        for (var i = 0; i < len; i++) {
            var obj = objects[i],
                id = obj.id = this.getId(obj),
                existing = this.get(id),
                munged = this.munge(obj);
            // console.warn(i, obj.id, existing, munged);
            if (existing) {
                existing.set(munged);
                updated++;
            } else {
                munged.id = id;
                this.add(munged);
                added++;
            }
            newIds[id] = true;
        }

        for (var oldId in oldIds) {
            if (!newIds[oldId]) {
                var old = oldIds[oldId];
                this.remove(old);
                removed++;
            }
        }

        // console.log("+"+added, "*"+updated, "-"+removed);
        return {added: added, updated: updated, removed: removed};
    }
});
Eddy.Model.ObjectList.extend = Backbone.Collection.extend;

var TWITPIC_RE = new RegExp(/(twitpic.com)\/(\w+)/g);
/**
 * A list of tweets
 */
Eddy.Model.TweetList = Eddy.Model.ObjectList.extend({
    model: Eddy.Model.Tweet,

    getId: function(o) {
        return (typeof o.tweet === "object")
            ? o.tweet.id || o.id
            : o.id;
    },

    getTwitpicURL: function(url) {
        var parts = url.split("/");
            id = parts.pop();
        parts.push("show/large", id);
        return parts.join("/");
    },

    getPhotoURL: function(text) {
        var match = TWITPIC_RE.exec(text);
        // console.warn("match", text, "->", match);
        if (match) {
            var base = "http://" + match[1],
                id = match[2],
                path = null;
            // console.log("domain:", match[1], "id:", match[2]);
            switch (match[1]) {
                case "twitpic.com":
                    path = "show/large/" + id;
                    break;
            }
            return path ? [base, path].join("/") : null;
        }
        return null;
    },

    munge: function(o) {
        var tweet = (typeof o.tweet === "object")
            ? o.tweet
            : o;
        // console.log(tweet.user, o.history.filter(function(a) { return a.length; }).map(function(a) { return a.join(":"); }));
        var placeTotals = {},
            mapped = o.history.map(function(pairs) {
                if (pairs.length) {
                    var map = {};
                    for (var i = pairs.length - 1; i >= 0; i--) {
                        var k = pairs[i][0];
                        if (k === null) k = "none";
                        var c = map[k] = pairs[i][1];
                        // console.log(k, "=", c);
                        if (k in placeTotals) {
                            placeTotals[k] += c;
                        } else {
                            placeTotals[k] = c;
                        }
                    }
                    return map;
                } else {
                    return null;
                }
            }),
            counts = mapped.map(function(places) {
                if (!places) return 0;
                var total = 0, len = places.length;
                for (var p in places) total += places[p];
                return total;
            });
        return {
            "user":             tweet.user, // "kanyewest"
            "user_icon":        tweet.icon, // URL to icon
            "user_name":        tweet.name, // URL to icon
            "text":             tweet.text, // tweet text
            "time":             tweet.time || ~~(new Date() / 1000), // UNIX timestamp
            "place_history":    mapped,
            "place_totals":     placeTotals,
            "href":             tweet.href,
            "urls":             tweet.urls,
            "icons":            tweet.icons || o.icons || [],
            "photo_url":        tweet.urls.length
               ? this.getTwitpicURL(tweet.urls[0][0])
               : this.getPhotoURL(tweet.text), // fully qualified photo URL (expanded from short URL)
            "retweet_counts":   counts,  // blah
            "retweet_total":    o.retweets // total retweet count
        }
    },

    updateIndex: function() {
        var max = this.models.length
           ? this.last().get("history").length - 1
           : -1;
        if (this.currentIndex == -1) {
            if (max > -1) {
                this.currentIndex = max;
            } else {
                return false;
            }
        }
        var index = this.currentIndex,
            len = 1,
            start = Math.max(0, index - len),
            end = index + 1;
        // console.log("updateIndex():", index, start);
        this.models.forEach(function(model) {
            var history = model.attributes.history,
                counts = model.attributes.retweet_counts,
                total = sum(counts.slice(0, end)),
                recent = sum(counts.slice(start, end));
            // console.log(model.id, "->", history[index], total, recent, xlr);
            model.set({
                "current_places": history,
                "current_count": counts[index],
                "current_total": total,
                "current_recent": recent
            });
        });
        return true;
    },

    update: function(data) {
        var updates = {};
        if (_.isArray(data.tweets)) {
            _.extend(updates, this.merge(data.tweets));
        }
        this.trigger("update", updates);
    }
});

/**
 * User list
 */
Eddy.Model.UserList = Eddy.Model.ObjectList.extend({
    model: Eddy.Model.User,

    getId: function(obj) {
        return obj.user;
    },

    munge: function(user) {
        var tweets = user.tweets, total = 0;
        if (tweets) {
            tweets = tweets.sort(function(a, b) {
                return b.time - a.time;
            });
            total = sum(tweets.map(function(tweet) {
                return tweet.retweets || 0;
            }));
        }
        return {
            "user":             user.user,
            "name":             user.name, // "Kanye West"
            "photo_url":        user.icon, // URL to photo (XXX: twitter icon?)
            "tweets":           tweets || [],
            "retweet_total":    total
        };
    },

    setTime: function(time) {
        this.selectedTime = time;
        this.updateTime();
    },
    updateTime: function() {
        var time = this.selectedTime;
        this.models.forEach(function(model) {
            var tweets = model.get("tweets");
            if (tweets && tweets.length) {
                var index = tweets.length - 1,
                    tweet = tweets[index];
                while (index > 0 && tweet && tweet.time > time) {
                    tweet = tweets[--index];
                }
                model.set({"recent_tweet": tweet, "recent_id": tweet ? tweet.id : null});
            }
        });
    },

    update: function(data) {
        var updates;
        if (_.isArray(data.users)) {
            updates = {};
            _.extend(updates, this.merge(data.users));
        } else if (_.isArray(data.tweets)) {
            updates = {};
            var tweets = data.tweets,
                len = tweets.length,
                users = {};
            for (var i = 0; i < len; i++) {
                var tweet = tweets[i];
                if (tweet.user in users) {
                    users[tweet.user].tweets.push(tweet);
                } else {
                    users[tweet.user] = {
                        "user": tweet.user,
                        "name": tweet.name,
                        "icon": tweet.icon,
                        "tweets": [tweet]
                    };
                }
            }
            users = d3.values(users);
            _.extend(updates, this.merge(users));
            this.updateTime();
        }
        if (updates) {
            this.trigger("update", updates);
        }
    },
});

/**
 * The FilterList is a list of Filter instances with convenience methods for
 * merging in new data from Loader.
 */
Eddy.Model.FilterList = Eddy.Model.ObjectList.extend({
    model: Eddy.Model.Filter,

    getId: function(filter) {
        return filter.name.replace(/ /g, '_').replace(/[^\w]+/g, '').toLowerCase();
    },

    currentIndex: -1,
    setIndex: function(index) {
        this.currentIndex = index;
        this.updateIndex();
    },

    // for munging data from Eddy into model form
    munge: function(filter) {
        var history = filter.history || [],
            len = history.length,
            total = 0,
            totals = [],
            deltas = [],
            acceleration = 0,
            recent = 0,
            rate = 0;

        if (len > 0) {
            // calculate cumulative history total
            for (var i = 0; i < len; i++) {
                total += history[i];
                totals.push(total);
                deltas.push(i > 0 ? (history[i] - history[i - 1]) : 0);
            }

            // number of "recent" steps
            var recentOffset = 3;
            recent = sum(history.slice(len - (recentOffset + 1)));
            rate = recent / recentOffset;
            // number of steps to count toward acceleration
            var accelOffset = 5;
            acceleration = sum(deltas.slice(len - (accelOffset + 1))) / accelOffset;
        }

        var hashtag;
        if (filter.meta && typeof filter.meta.hashtag == "string") {
            hashtag = filter.meta.hashtag;
            if (hashtag.charAt(0) != "#") {
                hashtag = "#" + hashtag;
            }
        } else {
            var match = filter.term.match(/(#\w+)/);
            hashtag = match ? match[1] : null;
        }

        // console.log("~", filter.name, [history, totals, deltas], "->", [recent, acceleration]);
        return {
            // straight copy stuff
            "name":     filter.name,
            "hashtag":  hashtag,
            "tags":     filter.tags,
            "term":     filter.term,
            "tweets":   filter.tweets,
            "photo_url": Eddy.Model.Filter.PHOTO_URL_TEMPLATE.replace("{id}", filter.id),
            // new stuff
            "total":    total,
            "last":     history[len - 1],
            "recent":   recent,
            "xlr":      acceleration,
            "history":  history,
            "totals":   totals,
            "deltas":   deltas,
            "rate":     rate,
            "munged":   true
        };
    },

    updateIndex: function() {
        var max = this.models.length
           ? this.last().get("history").length - 1
           : -1;
        if (this.currentIndex == -1) {
            if (max > -1) {
                this.currentIndex = max;
            } else {
                return false;
            }
        }
        var index = this.currentIndex,
            len = 1,
            start = Math.max(0, index - len),
            end = index + 1;
        // console.log("updateIndex():", index, start);
        this.models.forEach(function(model) {
            var history = model.get("history"),
                deltas = model.get("deltas"),
                total = sum(history.slice(0, end)),
                xlr = sum(deltas.slice(start, end)) / len,
                recent = sum(history.slice(start, end));
            // console.log(model.id, "->", history[index], total, recent, xlr);
            model.set({
                "current_count": history[index],
                "current_total": total,
                "current_recent": recent,
                "current_xlr": xlr
            });
        });
        return true;
    },

    update: function(data) {
        if (_.isArray(data.filters)) {
            var updates = {};
            _.extend(updates, this.merge(data.filters));
            this.updateIndex();
            this.trigger("update", updates);
        }
    }
});

Eddy.Model.Timeline = Eddy.Model.ObjectList.extend({
    model: Eddy.Model.Checkpoint,

    initialize: function() {
        this.timeframes = {};
        // create the "current" timeframe, which others should be able to
        // listen to for "change" events
        this.getTimeframe("current");
    },

    // keep checkpoints ordered by time
    comparator: function(check) {
        return check.get("time");
    },

    timeframes: null,
    targetTimeframe: "current",

    getTimeframe: function(id, attrs) {
        var tf;
        if (this.timeframes[id]) {
            tf = this.timeframes[id];
            if (attrs) tf.set(attrs);
        } else {
            if (!attrs) attrs = {};
            attrs['id'] = id;
            tf = this.timeframes[id] = new Eddy.Model.Timeframe(attrs);
        }
        this.trigger("add:timeframe", tf);
        return tf.update();
    },

    update: function(data) {
        if (_.isArray(data.filters)) {

            var start = data.time.start_time, // epoch seconds
                period = data.time.period, // step seconds
                filters = data.filters,
                steps = (data.history || filters[0].history).length;
            // console.log("***", [start, period, steps]);

            var current = this.getTimeframe("current", {
                "start_time": start,
                "end_time": data.time.end_time || 0,
                "period": period,
                "steps": steps
            });
            var end = current.get("end_time");
            console.log("END:", end);
            // console.info("* current timeframe:", current.toJSON());

            var grandTotal = 0,
                checkpoints = data.history.map(function(count, i) {
                    var time = start + i * period;
                    grandTotal += count;
                    return {
                        "id": [time, period].join(":"),
                        "date": new Date(time * 1000),
                        "time": time,
                        "count": count,
                        "total": 0
                    };
                });

            // accumumate totals by adding previous values
            checkpoints.forEach(function(check, i) {
                check.total = check.count;
                if (i > 0) {
                    check.total += checkpoints[i - 1].total;
                }
            });

            var usages = data.usage,
                len = usages.length,
                found = null;
            for (var i = 0; i < len; i++) {
                var usage = usages[i];
                if (end > usage.start && end <= usage.end) {
                    console.log("good!", usage.label);
                    found = usage;
                } else {
                    console.log("bad.", usage.label, [end, usage.start, usage.end]);
                }
            }
            console.warn("found usage:", found);    

            for (var i = 0; i < len; i++) {
                var usage = usages[i],
                    timeframe = this.getTimeframe(usage.label, {
                        "label": usage.label,
                        "start_time": usage.start,
                        "end_time": usage.end,
                        "period": period,
                        "steps": steps,
                        "count": usage.count,
                        "goal": usage.goal
                    });
            }

            var overall = this.runningTotalTimeframe = this.getTimeframe(found.label) || current,
                cutoff = overall.get("start_time");

            var currentTotal = overall.get("count");
            grandTotal = Math.max(currentTotal, grandTotal);
            console.info("grand total:", grandTotal, "current:", current.get("count"), "overall:", overall.get("count"));

            if (grandTotal > 0) {
                var remaining = grandTotal;
                checkpoints.reverse().forEach(function(check, i) {
                    var count = check.count;
                    check.running_total = remaining;
                    check.in_bounds = (check.time < cutoff);
                    check.show_total = check.in_bounds
                        ? check.running_total
                        : currentTotal;
                    currentTotal -= count;
                    remaining -= count;
                });
                // console.log("remaining:", remaining, "of", grandTotal);
            } else {
                // if no grand total is found, use the totals for this timeframe
                checkpoints.forEach(function(check, i) {
                    check.running_total = check.total;
                });
            }

            var updates = this.merge(checkpoints);
            updates.timeframe = current.toJSON();
            // console.log("timeline update timeframe:", updates.timeframe);
            this.trigger("update", updates);
        }
    }
});

/**
 * The Loader repeatedly loads JSON data from Eddy.
 */
Eddy.Loader = function(baseURL, lastURI) {
    this.baseURL = baseURL;
    this.lastURI = lastURI;

    this.loaded = 0;
    this.latency = 0;
    // event dispatch mix-in
    _.extend(this, Backbone.Events);

    // for unbound functions
    var loader = this;

    this.start = function(nextURI, resetLoaded) {
        console.log("loader.start(", [nextURI, resetLoaded || false], ")");
        if (resetLoaded) loaded = 0;
        abortNext();
        return loader.load(nextURI || this.lastURI);
    };

    this.stop = function(message) {
        abortNext();
        loader.trigger("stopped", {message: message});
    };

    var nextTimeout;
    function abortNext() {
        if (nextTimeout) {
            clearTimeout(nextTimeout);
            return true;
        } else {
            return false;
        }
    }

    function getCallback(uri) {
        var parts = uri.split(".");
        return parts[0].replace(/[^\w]/g, "_");
    }

    this.next = function(nextURI, wait) {
        if (arguments.length <= 1) {
            return this.load(nextURI || this.next.uri);
        }
        // console.log("loader.next(", [nextURI, wait, this.latency], ")");
        this.next.uri = nextURI;
        this.next.wait = wait;
        if (wait > 0) {
            var timeout = wait * 1000;
            if (this.latency > timeout) {
                console.warn("latency > timeout:",
                    (this.latency / 1000).toFixed(2) + "s vs.",
                    (timeout / 1000).toFixed(2) + "s",
                    "; ignoring!"
                );
            } else {
                timeout -= this.latency;
            }
            return setTimeout(function() {
                loader.load(nextURI);
            },  timeout);
        } else {
            // still defer it
            return setTimeout(function() {
                loader.load(nextURI);
            }, 1);
        }
    };

    this.load = function(uri) {
        abortNext();
        var url = this.baseURL + uri,
            time = +new Date();
        this.trigger("loading", {url: url});
        return $.ajax(url, {
            dataType: "jsonp",
            jsonpCallback: getCallback(uri),
            cache: true,

            success: function(data) {
                // var latency = loader.latency = new Date() - time;
                // console.info("* load took:", (latency / 1000).toFixed(2), "seconds");
                loader.trigger("load", data);
                // console.log("loader.load() [success]:", data);
                var next = data.next
                        ? data.next.href
                        : null,
                    wait = data.next
                        ? data.next.wait || 0
                        : 60;
                if (next) {
                    // loader.stop("Stopping because it's broken");
                    nextTimeout = loader.next(next, wait);
                } else {
                    loader.stop("No next.href in response");
                    loader.start(null, true);
                }
            },

            error: function(req) {
                loader.trigger("error", {message: req.statusText});
                var wait = loader.next.wait / 2 || 10;
                console.warn("error loading; retrying in", wait, "seconds...");
                nextTimeout = loader.next(uri, wait); // FIXME: how long should we wait here?
            }
        });
    };
};

function sum(numbers) {
    return numbers.reduce(function(memo, n) {
        return memo + n;
    }, 0);
}

$.fn.detect = function() {
    var query = $.deparam.querystring(location.search),
        nav = navigator.userAgent,
        classes = {
            ie: nav.match(/MSIE\s([^;]*)/) ? true : false,
            ios: nav.match(/like Mac OS X/i) ? true : false,
            iphone: nav.match(/iPhone/i) ? true : false,
            ipad: nav.match(/iPad/i) ? true : false,
            firefox: nav.match(/Firefox/i) ? true : false,
            webkit: nav.match(/WebKit/i) ? true : false,
            safari: nav.match(/Safari/i) ? true : false,
            chrome: nav.match(/Chrome/i) ? true : false,
            opera: nav.match(/Opera/i) ? true : false
        };
    for (var klass in classes) {
        var hasit = query[klass] === "1" || (classes[klass] && query[klass] !== "0");
        this.toggleClass(klass, hasit);
    }
    return this;
};

})();

