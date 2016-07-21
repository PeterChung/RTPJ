/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
if (typeof Eddy === "undefined") Eddy = {};
(function() {

function prettyTime(format) {
    return function(d) {
        return format(d).replace(/^0+/, '');
    };
}
var HOUR_FORMAT = prettyTime(d3.time.format("%I%p")),
    TIME_FORMAT = prettyTime(d3.time.format("%I:%M%p")),
    DATE_FORMAT = d3.time.format("%b %e"),
    COMMIZE = d3.format(",d");

Eddy.UI = {};

var makeURL = Eddy.UI.url = function(view, params) {
    var url = Eddy.UI.url.base + "#";
    if (view) url += view;
    if (params) {
        url += $.param.querystring("", params);
    }
    return url;
};

Eddy.UI.url.base = location.href.split("#").shift();

// you can reference COLORS internally, but use Eddy.UI.colors[name] globally
var COLORS = Eddy.UI.colors = {
    bg: "black",
    fg: "white",
    pink: "#E92E82",
    flash: "#c8fff1",
    purple: "#74276C",
    teal: "#41F7C7",

    get: function(name) {
        var c = COLORS[name], n = 0;
        while (c in COLORS) {
            c = COLORS[c];
            if (++n == 10) throw "Possible infinite loop in color resolution: " + c;
        }
        return c;
    },
    set: function(name, value) {
        return COLORS[name] = value;
    }
};

/**
 * Our View class handles rendering data by responding to tracker events.
 */
Eddy.UI.View = function() {
    this.initialize.apply(this, arguments);
};
_.extend(Eddy.UI.View.prototype, Backbone.Events, {
    /**
     * autoResize determines whether the view will automatically respond to
     * window "resize" events and set its own size according to the computed
     * dimensions of its container. If your view does everything with
     * intrinsically sized DOM elements you should set autoResize to false.
     */
    autoResize: true,
    params: {},
    defaults: {},

    /**
     * initialize() is our constructor, which gets passed an Eddy.Tracker
     * instance and an optional CSS selector for where it should be "attached"
     * via attach().
     */
    initialize: function(tracker, selector, params) {
        this.tracker = tracker;
        if (selector) {
            this.attach(selector);
        }
        if (params) {
            this.setParams(params);
        }
    },

    getParams: function() {
        var p = _.clone(this.params);
        if (this.defaults) {
            for (var d in this.defaults) {
                delete p[d];
            }
        }
        return p;
    },

    /**
     * attach() attaches the UI to the DOM. By default we set this.selector so
     * we can refer to it later, stash a jQuery reference to $(selector), and
     * listen for window "resize" events to resize the UI.
     */
    attach: function(selector) {
        this.selector = selector;
        this.orientation = window.orientation;
        this.ipad = $("body").detect().hasClass("ipad");
        this.mobile = $("body").hasClass("iphone");
        this.tv = $("body").hasClass("tv");
        this.$container = $(this.selector);
        this.onResize = _.bind(this.onResize, this);
        $(window).bind("resize", this.onResize).trigger("resize");
    },

    /**
     * detach() only stops listening to window "resize" events. The rest of the
     * cleanup is up to subclasses.
     */
    detach: function() {
        this.$container = this.selector = null;
        $(window).unbind("resize", this.onResize);
    },

    /**
     * Eddy.Tracker passes down query string parameters when the URL hash
     * changes. Implement this method to respond to them.
     */
    setParams: function(params) {
        this.params = params || {};
        if (this.defaults) _.defaults(this.params, this.defaults);
    },

    /**
     * setSize() changes the size of the view in pixels.
     */
    setSize: function(width, height) {
        if (!this.size || this.size.x != width || this.size.y != height) {
            this.oldSize = this.size || {x: 0, y: 0};
            this.size = {x: width, y: height};
            this.resize();
        }
    },

    /**
     * resize() is where you should set child element positions and sizes. This
     * gets called inside setSize() if the new dimensions differ from the
     * current ones.
     */
    resize: function() {
    },

    /**
     * onResize() is our window "resize" event handler, which gets bound to the
     * Eddy.View instance rather than the window object. The default behavior
     * is to read the inner width and height from this.$container and pass them
     * off to setSize().
     */
    onResize: function(e) {
        var w = this.$container.innerWidth(),
            h = this.$container.innerHeight();
        this.setSize(w, h);
    }
});

Eddy.UI.ViewBox = function(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
};
Eddy.UI.ViewBox.prototype = {
    toString: function() {
        return [this.x, this.y, this.width, this.height].join(" ");
    }
};

Eddy.UI.HotRod = function() {
    Eddy.UI.View.apply(this, arguments);
};
_.extend(Eddy.UI.HotRod.prototype, Eddy.UI.View.prototype, {
    attach: function(selector) {
        Eddy.UI.View.prototype.attach.call(this, selector);
    },

    detach: function() {
        Eddy.UI.View.prototype.detach.call(this);
        this.cancel();
    },

    cancel: function() {
        if (this.loader) { 
            this.loader.abort();
            this.loader = null;
        }
    },

    loadFilter: function(id) {
        this.cancel();
        var url = this.tracker.loader.baseURL +
            "manual/{id}.jsonp".replace("{id}", id);
        this.loader = $.ajax(url, {
            dataType: "jsonp",
            jsonpCallback: "manual_" + id,
            success: _.bind(this.onLoad, this),
            error: function() {
                console.error("COULDN'T LOAD:", url);
            }
        });
    },

    onLoad: function(data) {
        // console.log("ON LOAD:", data);
        if (data.length) {
            this.showTweet(data[0]);
        }
    },

    showTweet: function(tweet) {
        var div = formatTweet(tweet);
        this.$container.append(div);
        this.show();
    },

    clear: function() {
        this.$container.empty();
    },

    show: function() {
        this.$container.appendTo(this.$container[0].parentNode);
        this.$container.show();
    },

    hide: function() {
        this.cancel();
        this.clear();
        this.$container.hide();
    }
});

Eddy.UI.RankedList = function() {
    Eddy.UI.View.apply(this, arguments);
};
_.extend(Eddy.UI.RankedList.prototype, Eddy.UI.View.prototype, {
    initialize: function(tracker, selector) {
        Eddy.UI.View.prototype.initialize.call(this, tracker, selector);
    },

    setParams: function(params) {
        Eddy.UI.View.prototype.setParams.call(this, params);
        this.selectFilter(this.params.id);
    },

    selectFilter: function(id) {
        this.selectedId = id;
        this.updateSelection();
    },

    updateSelection: function() {
        var id = this.selectedId;
        this.ul.selectAll("li.item")
            .classed("selected", id
                ? function(d, i) {
                    d.selected = (d.id == id);
                    return d.selected;
                } : false);
    },

    attach: function(selector) {
        // console.log("+ LIST");
        var ipad = this.ipad;
        this.listWidth = 460;
        Eddy.UI.View.prototype.attach.call(this, selector);

        this.d3 = d3.select(selector);
        this.div = this.d3.append("div")
            .attr("class","list")
            .style("width", (this.mobile || this.ipad) ? "auto" : (this.listWidth + "px"));

        this.ul = this.div.append("ul");

        this.ul.append("li")
            .attr("class","filler")
            .style("display","none")
            .append("span")
            .attr("class","label");

        this.tracker.filters.bind("update", this.update, this);
    },

    detach: function() {
        // console.log("- LIST");
        Eddy.UI.View.prototype.detach.call(this);
        this.d3 = null;
        this.div.remove();
        this.div = null;
        this.ul = null;
        this.tracker.filters.unbind("update", this.update, this);
    },

    setList: function(people, linkTemplate) {
        var items = this.ul.selectAll("li.item")
            .data(people, function(person) {
                return person.id;
            });

        var entering = items.enter().insert("li","li.filler")
            .attr("class", "item");

        var ranks = entering.append("span")
            .attr("class", "rank")
            .style("font-size", (this.ipad) ? "25px" : "12px");

        var labels = entering.append("span")
            .attr("class", "label")
            .attr("id", function(d, i) {
                return d.id;
            });

        labels.append("a")
            .attr("class", "name")
            .attr("href", function(d, i) {
                return linkTemplate ? linkTemplate.replace("{id}", d.id) : null;
            })
            .text(function(d, i) { return d.name.toUpperCase(); });
        labels.append("span")
            .attr("class", "count")
            .style("font-size", "15px")
            .text(function(d, i) { return COMMIZE(d.total); });

        var exiting = items.exit()
            .remove();

        this.updateSelection();
        this.update();
    },

    update: function() {
        var listWidth = this.listWidth;
        var mobile = this.mobile;
        var ipad = this.ipad;
        var all = this.ul.selectAll("li.item")
            .sort(function(a, b) {
                return b.count - a.count;
            })
            .each(function(d, i) {
                d.rank = i + 1;
                //console.log(d.id, i, d.rank);
            });

        var maxSize = (ipad) ? 120 : 60;
        var first = $("li.item:first-child")
             .css("font-size", maxSize);
        var maxWidth = (mobile) ? 200 : listWidth-120;
         while (first.find(".name").width() > maxWidth) {
            maxSize -= 2;
            first.css("font-size", maxSize);
        }

        // derive a scale for the counts
        var counts = [];
        all.each(function(d) { counts.push(d.count); });
        var tscale = d3.scale.linear()
            .domain([d3.min(counts), d3.max(counts)])
            .rangeRound([25, maxSize]);

        // update the total
        all.select(".count")
            .text(function(d, i) {
                return COMMIZE(d.count);
            });

        // set font size on name to determine size
        all.style("font-size", function(d, i) {
                return tscale(d.count) + "px"; // XXX: use something other than total?
            })
            .select(".label")
            .style("padding-left",function(d,i){
                var top = $(this).offset().top;
                var width = $(this).find(".name").innerWidth();
                if (mobile || ipad) return "0";
                else return ~~(listWidth - 70 - top/6 - width) + "px";
            });

        // update the ranks
        all.select(".rank")
            .text(function(d, i) {
                return d.rank;
            })
            .style("margin-top", function(d){
                return (tscale(d.count) - 22) + "px";
            })
            .style("margin-left",function(){
                var width = $(this).innerWidth();
                if (ipad) return "10px";
                else return (20-width)+ "px";
            });
        var topEdge = this.$container.offset().top;
        var top;
        all.style("margin-left",function(d){
                top = $(this).offset().top - topEdge;
                if (mobile || ipad) return "0";
                else return ~~(top/6) + "px";
            })
        if (this.tv) {
            d3.select("li.filler")
            .style("display","block")
            .style("height","400px")        
            .style("margin-left", function(){
                var lastHeight = $("li.item:last").height();
                return ~~((top+lastHeight)/6) + "px";
            }).select(".label")
            .style("padding-right","500px")
            .style("margin-left","65px")
            .style("height","400px")
            .style("z-index","-1")
            .style("display","block");
        }
    }
});

/**
 * Buzz view
 */
Eddy.UI.Buzz = function() {
    Eddy.UI.View.apply(this, arguments);
};
_.extend(Eddy.UI.Buzz.prototype, Eddy.UI.View.prototype, {
    mode: "recent",

    attach: function(selector) {
        Eddy.UI.View.prototype.attach.call(this, selector);

        this.d3 = d3.select(selector);

        this.triHeight = Math.sqrt(3)/3;
        this.backImages = ["white-triangle-dashed.png","white-triangle-outline.png","white-triangle-pink.png"];
        this.triangleList = {};

        this.d3.append("div")
            .attr("id","tweets")
            .style("height","100%");

        $("#nav ul").append(
            $("<li>").append(
                $("<a>").text("RECENT").attr("href", makeURL("buzz", {mode: "recent"}))
            ).attr("class", "secondary recent"),
            $("<li>").append(
                $("<a>").text("OVERALL").attr("href", makeURL("buzz", {mode: "total"}))
            ).attr("class", "secondary total")
        );
        this.updateMode();

        if (this.mobile) this.viewBox = new Eddy.UI.ViewBox(-150, 50, 700, 550);
        else if (this.ipad) this.viewBox = new Eddy.UI.ViewBox(-150, 20, 700, 600);
        else if (this.tv) this.viewBox = new Eddy.UI.ViewBox(50, 150, 600, 700);
        else this.viewBox = new Eddy.UI.ViewBox(50, 50, 600, 700);

        this.svg = this.d3.append("svg:svg")
            .attr("width","100%")
            .attr("height", "100%")
            .attr("viewBox", this.viewBox)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("class","buzz")
            
        this.main = this.svg.append("svg:g")
            .attr("id","main");

        this.selectedSize = 300;
        
        var that = this;
        window.onorientationchange = function(){
            that.orientation = window.orientation;
            if (that.orientation == 90 || that.orientation == -90) this.viewBox = new Eddy.UI.ViewBox(0, 50, 700, 550);
            else this.viewBox = new Eddy.UI.ViewBox(-150, 50, 700, 400);
            that.svg
                .attr("viewBox", this.viewBox);
        }
        // I can't get this working :()

        this.list = new Eddy.UI.RankedList(this.tracker, this.selector);
        
        this.onCurrentChange.debounced = _.debounce(this.onCurrentChange, 20);

        this.tracker.filters.bind("update", this.update, this);
        this.tracker.filters.bind("change:current_count", this.onCurrentChange.debounced, this);
    },

    setParams: function(params) {
        // console.log("setParams():", JSON.stringify(params));

        this.lastId = this.params ? this.params.id : null;

        Eddy.UI.View.prototype.setParams.call(this, params);
        this.params.list = (this.params.list !== "0" && this.params.list !== false);
        
        if (!this.params.list && this.list) {
            this.list.detach();
            this.list = null;
        } else if (this.params.list && !this.list) {
            this.list = new Eddy.UI.RankedList(this.tracker, this.selector);
        }
        if (this.params.mode && this.params.mode != this.mode) {
            this.mode = this.params.mode;
            this.updateMode();
            this.update({});
            this.updateTriangles();
        }

        // this.selectFilter(this.lastId);
        this.updateSelection();
    },

    updateMode: function() {
        var mode = this.mode;
        $("#nav li.secondary").each(function() {
            var li = $(this);
            li.toggleClass("selected", li.hasClass(mode));
        });
    },

    updateSelection: function() {
        var oldId = this.lastId,
            needsUpdate = false;

        console.log("HOTROD?", this.hotrod);

        if (oldId && oldId != this.params.id) {
            if (this.hotrod) {
                this.hotrod.hide();
            }
            this.deselectFilter(oldId, this.params.id ? true : false);
            needsUpdate = true;
        }
        if (this.params.id && this.params.id != oldId) {
            if (this.hotrod) {
                this.hotrod.loadFilter(this.params.id);
            }
            this.selectFilter(this.params.id);
            needsUpdate = true;
        }
        if (needsUpdate) {
            this.updateTriangles();
        }
        this.lastId = this.params.id;
    },

    selectFilter: function(id) {
        if (id == null) return;
        var ipad = this.ipad;
        var mobile = this.mobile;

        if (this.list) {
            this.list.selectFilter(id);
        }
        //if (this.list)

        var svg = this.svg,
            TWEETS = $("#tweets"),
            triHeight = this.triHeight,
            selectedSize = this.selectedSize,
            hasList = this.list && !this.hotrod,
            node = svg.select("#triangle-" + id);

        node.each(function(d) {
            d.selected = true;
            this.active = true;
            if (hasList) populateTweets(d);
        });

        node.call(selectTriangle);

        function populateTweets(d){
            TWEETS.empty().append(
                $("<h1>").append(
                    $("<a>")
                        // .addClass("hashtag")
                        .attr("href", "http://twitter.com/intent/tweet?text=" + escape(d.hashtag))
                        .text(d.hashtag)
                    ),
                $("<a>")
                    .attr("href", makeURL("buzz"))
                    .addClass("back")
                    .text((mobile || ipad) ? "close" : "<< back")
                
                        /*,
                    " ", COMMIZE(d.total), " tweets" */
                //)
            );
            var len = d.tweets.length;
            len = Math.min(len, 5);
            for (var i = 0; i < len; i++){
                var t = formatTweet(d.tweets[i]);
                TWEETS.append(t);
            }
            if (mobile || ipad){
                TWEETS.data("open", true);
                TWEETS.css({'position':'relative','right':'0','display':'block'}).insertAfter($("#"+id));
            }
            if (!TWEETS.data("open")) {
                TWEETS.data("open", true);

                var top = $("#view").offset().top;
                    offset = $("#"+id).offset();
                if (offset) top = offset.top - top;
                d3.select("#tweets")
                    .style("display","block")
                    .style("right","-350px")
                    .transition().duration(500)
                    .style("right","0px");
                d3.select("div.list")
                    .style("right","0")
                    .style("top","0")
                    .transition().duration(500)
                    .style("top",-top+"px")
                    .style("right","350px");
                d3.select("#main")
                    .transition().duration(500)
                    .attr("transform","translate(-350,0)");
            }
        }

        function selectTriangle(node){
            var tri = node;
            if (tri.empty()) return;

            svg.attr("class","buzz selection");

            svg.selectAll("g.filter")
                .select("image.photo")
                // .attr("opacity","1")
                // .transition().duration(500) //this is breaking things for some reason
                .attr("opacity",".3");

            var triNode = tri.node();
            triNode.parentNode.appendChild(triNode);

            tri.insert("svg:image","g")
                .attr("id","selectedBG")
                .attr("xlink:href","assets/images/bgshape4.png")
                .attr("width","0")
                .attr("height","0")
                .attr("x",-selectedSize)
                .attr("y",-selectedSize)
                .attr("transform","scale(0)")
                .transition().delay(300).duration(700)
                .attr("transform","scale(1)")
                .attr("width",selectedSize*2)
                .attr("height",selectedSize*2);

            tri.attr("class","filter selected");        

            tri.select("image.photo")
                .attr("opacity","1");
        }
    },

    deselectFilter: function(id, keepTweets) {
        var svg = this.svg;
        var TWEETS = $("#tweets");
        var triHeight = this.triHeight;
        var node = svg.select("#triangle-" + id).each(function(d){ d.selected = false; this.active = false; });
        node.call(deselectTriangle);

        if (this.list) {
            this.list.selectFilter(null);
        }

        function deselectTriangle(){
            var tri = this;
            var TWEETS = $("#tweets");
            if (TWEETS.data("open") && !keepTweets) {
                TWEETS.data("open", false);
                d3.select("#tweets")
                    .style("right","0px")
                    .transition().duration(500)
                    .style("right","-350px");
                d3.select("div.list")
                    .transition().duration(500)
                    .style("top","0px")
                    .style("right","0px");
                d3.select("#main")
                    .transition().duration(500)
                    .attr("transform","translate(0,0)");
                d3.select("#tweets").transition().delay(500).style("display","none");
            }
            tri.select("#border").remove();
            tri.select("#border-img").remove();
          
            svg.attr("class","buzz");

            tri.select("#selectedBG").remove();

            tri.transition().duration(1000)
            .attr("transform", function(d,i){
                    return "translate("+d.triangle.center.x+","+d.triangle.center.y+")";
                });

            svg.selectAll("g.filter")
                .select(".photo")
                // .attr("opacity",".3")
                // .transition().duration(500)
                .attr("opacity","1");

            tri.select("path")
                .transition().duration(1000)
                .attr("d", function(d, i) {
                    //storing position attributes
                    var line = d3.svg.line()
                        .x(function(p) { return p.x; })
                        .y(function(p) { return p.y; });
                    var points = d.triangle.points();
                    return line(points);
                });

            tri.attr("class","filter")
            .select("a")
                .attr("xlink:href",function(d){ return makeURL("buzz", {id: d.id}); })
            .select(".photo")
                .transition()
                .duration(1000)
                .attr("width",function(d){return 2*d.r})
                .attr("height",function(d){return 2*d.r})
                .attr("x",function(d){return -d.r})
                .attr("y",function(d){
                    return ((d.triangle.angle+360)%120 == 90)
                        ? -2 * d.r * triHeight
                        : -3 * d.r * triHeight;
                })
                .attr("opacity","1");
        }
    },

    updateTriangles: function(multiplier) {
        if (isNaN(multiplier)) multiplier = 1;

        var svg = this.svg,
            triHeight = this.triHeight,
            all = svg.selectAll("g.filter"),
            backgrounds = svg.selectAll("g.background"),
            center = this.getCenter(),
            offset = this.offset || {x: 0, y: 0},
            focalPoint = "translate(" + (center.x + offset.x) + ","+ (center.y + offset.y) + ")",
            selectedSize = this.selectedSize;

        var selectedTriangle = new Triangle(this.selectedSize, 30, this.getCenter());

        all.call(updateTriangles);
        backgrounds.call(updateBackgrounds);

        function finish() {
            d3.select(this)
                .transition()
                .duration(500 * multiplier)
                .ease("back-out")
                .attr("transform", function(d,i){
                    d.triangle.oldx = d.triangle.center.x;
                    d.triangle.oldy = d.triangle.center.y;
                    if (d.selected) return focalPoint;
                    else return "translate("+d.triangle.center.x+","+d.triangle.center.y+")";
                });
        }

        function updateTriangles() {
            this.transition()
                .duration(600 * multiplier)
                .ease("back")
                .attr("transform", function(d,i){
                    var x = d.triangle.oldx;
                    var y = d.triangle.oldy;
                    if (isNaN(x) || isNaN(y)) {
                        return "translate("+d.triangle.center.x+","+d.triangle.center.y+")";
                    } else if (d.selected){
                        return focalPoint;
                    } else {
                        return "translate("+(x+(y-d.triangle.center.y)*.32)+","+d.triangle.center.y+")";
                    }
                })
                .each("end", finish);
            
            var line = d3.svg.line()
                .x(function(p) { return p.x; })
                .y(function(p) { return p.y; });

            var path = this.select("path")
                .attr("transform",function(d){
                    return "rotate("+d.triangle.angle+")";
                });
            path.transition()
                .duration(1000 * multiplier)
                .attr("d", function(d, i) {
                    //storing position attributes
                    
                    if (d.selected) var points = selectedTriangle.points();
                    else var points = d.triangle.points();
                        //return "M200,0L-100,173.205081L-100,-173.205081";
                    return line(points);
                    /*
                    points.splice(points[0], 0);
                    if (d.selected) {
                        var r = 400;
                        points = [
                            {x: -r, y: -r},
                            {x: +r, y: -r},
                            {x: +r, y: +r},
                            {x: -r, y: +r}
                        ];
                    }
                    return line(points);
                    */
                });

            var size = function(d) { return ~~(2 * d.r); }

            var photos = this.select("a")
                .attr("xlink:href",function(d){
                    if (d.selected) return makeURL("buzz");
                    else return makeURL("buzz", {id: d.id});
                })
                .select(".photo");

            photos.transition()
                .duration(1000 * multiplier)
                .attr("width", function(d){ return (d.selected) ? (selectedSize*2) : ~~(2 * d.r); })
                .attr("height", function(d){ return (d.selected) ? (selectedSize*2) : ~~(2 * d.r); })
                .attr("x", function(d){ return (d.selected) ? -selectedSize : -d.r; })
                .attr("y", function(d) {
                    var r = d.selected ? selectedSize : d.r;
                    return ((d.triangle.angle+360)%120 == 90)
                        ? -r * triHeight
                        : -2 * r * triHeight;
                });
        }

        function updateBackgrounds() {
            this.transition()
                .duration(600 * multiplier)
                .ease("back")
                .attr("transform", function(d,i){
                    return "translate("+d.triangle.center.x+","+d.triangle.center.y+")";
                })
                .each("end", finish);

            var line = d3.svg.line()
                .x(function(p) { return p.x; })
                .y(function(p) { return p.y; });

            this.select("path") 
                .attr("transform",function(d){
                    return "scale(1.3) rotate("+d.triangle.angle+")";
                })
                .attr("d", function(d, i) {
                    //storing position attributes
                    var points = d.triangle.points();
                    return line(points);
                });
        }
    },

    onCurrentChange: function() {
        var that = this,
            props = ["count", "total", "recent", "xlr"];
        this.svg.selectAll("g.filter")
            .each(function(d, i) {
                props.forEach(function(p) {
                    d[p] = d._model.get("current_" + p) || 0;
                });
            });

        this.updateScales();
        this.updateTriangles();
    },

    resize: function() {
        if (this.svg) {
            // TODO: resize more intelligently?
            // this.svg.attr("width", this.size.x - this.list.listWidth / 2);
        }
    },

    detach: function() {
        Eddy.UI.View.prototype.detach.call(this);
        this.svg.remove();
        this.svg = null;
        this.d3 = null;
        $("#tweets").remove();
        $("#nav li.secondary").remove();
        if (this.list) {
            this.list.detach();
            this.list = null;
        }

        this.tracker.filters.unbind("update", this.update, this);
        this.tracker.filters.unbind("change:current_count", this.onCurrentChange.debounced, this);
    },

    updateScales: function() {
        if (!this.data) return;

        var prop = this.mode == "recent"
            ? "recent"
            : "total";
        this.data = this.data.sort(function(a, b) {
            return b[prop] - a[prop];
        });
        var filters = this.data,
            len = filters.length,
            totals = filters.map(function(d) {
                    return d[prop];
                }),
            tmin = d3.min(totals) || 1,
            tmax = d3.max(totals),
            tscale = d3.scale.linear()
                .domain([tmin, tmax])
                .range([25, 160]);

        var nextIndex = 0,
            center = this.getCenter();
        for (var i = 0; i < len; i++){
            var d = filters[i];
            var tri = d.triangle;
            tri.neighbors = [];
            tri.center = center;

            //setting the radius!
            d.r = tscale(d[prop]);
            tri.size = d.r;
            if (i > 0){
                for (var j = 0; j < len; j++) {
                    if (j == i) continue;
                    var neighbor = filters[j].triangle,
                        index = ++nextIndex, // ~~(Math.random() * 2.9999),
                        adjoined = neighbor.adjoin(d.triangle, index);
                    if (adjoined) {
                        break;
                    }
                }
            }
        }

        this.svg.selectAll("g.filter")
            .sort(function(a,b){
                return a.selected
                    ? 1
                    : b.selected
                      ? -1
                      : a[prop] - b[prop];
            });

        var step = 0, maxStep = 20,
            xlr = filters.map(function(d) {
                    return (d.xlr > 0) ? d.xlr : 0;
                }).sort(function(a, b) {
                    return a - b;
                }),
            getSpeed = d3.scale.linear()
                .domain([0, xlr.pop()])
                .rangeRound([maxStep, 2]);

        this.svg.selectAll("g.background")
            .each(function(d, i) { 
                d.step = ~~(Math.random() * maxStep + 1); 
                d.speed = getSpeed(d.xlr);
                // console.log(d.id, d.xlr, "->", d.speed);
            })
            .sort(function(a,b){
                return b.speed - a.speed;
            });

        if (this.list) {
            var people = filters.map(function(filter) {
                return {
                    id: filter.id,
                    name: filter.name,
                    count: filter[prop]
                };
            });
            this.list.setList(people, unescape(makeURL("buzz", {id: "{id}"})));
        }
    },

    getCenter: function() {
        var x = 0, // this.viewBox.x,
            y = 0, // this.viewBox.y,
            w = this.viewBox.width,
            h = this.viewBox.height;
        return {
            x: x + w / 3.3,
            y: y + h / 1.7
        };
    },

    update: function(updates) {
        // console.log("update:", JSON.stringify(updates));

        var triHeight = this.triHeight,
            w = this.viewBox.width,
            h = this.viewBox.height,
            center = this.getCenter();

        var svg = this.main;
        var triangleList = this.triangleList;
        var backImages = this.backImages;

        var that = this;
        var prop = this.mode == "recent"
            ? "recent"
            : "total";

        var needsSelection = !this.data && this.params.id;

        var selectedId = this.params.id;
        var filters = this.data = this.tracker.filters.models.map(function(filter, i){ 
            var data = filter.toJSON();
            data._model = filter;
            data[prop] = filter.get("current_" + prop);
            data.selected = data.id == selectedId;
            if (data.id in triangleList) {
                data.triangle = triangleList[filter.id];
            } else {
                var angle = (i % 2 ? -1 : 1) * 30;
                data.triangle = triangleList[filter.id] = new Triangle(100, angle ,center);
            }
            // that.freshenUpData(data);
            return data; 
        }).filter(function(data) {
            return data.id != "mtv_vmas";
        });

        this.updateScales();

        // TODO: sort then filter?
        // filters = filters.slice(0, 10);

            var backTriangles = svg.selectAll("g.background")
                .data(filters,function(filter){
                    return filter ? filter.id : null;
                });
            var backNew = backTriangles.enter().append("svg:g")
                .attr("class","background")
                .attr("transform", function(d, i) {
                    return "translate("+d.triangle.center.x+","+d.triangle.center.y+")";
                });
                
            backNew.append("svg:path");

            backTriangles.exit().remove();
                
            var triangles = svg.selectAll("g.filter")
                .data(filters, function(filter){
                    return filter ? filter.id : null;
                });
            // select the filter if it isn't selected?
            /*
            triangles.each(function(d, i) {
                if (d.selected && !this.active) {
                    that.selectFilter(d.id);
                }
            });
            */

            var entering = triangles.enter().append("svg:g")
                .attr("id", function(d) { return "triangle-" + d.id; })
                .attr("class", "filter")
                .attr("transform", function(d, i) {
                    return "translate("+d.triangle.center.x+","+d.triangle.center.y+")";
                });

            entering.append("svg:g")
                .attr("clip-path",function(d){ return 'url(#clip-' + d.id + ')'; })
                .append("svg:a")
                    .attr("xlink:href",function(d){ return makeURL("buzz", {id: d.id}); })
                .append("svg:image")
                    .attr("class","photo")
                    .attr("xlink:href",function(d){return d.photo_url; })
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", 0)
                    .attr("height", 0);
            entering.append("svg:title")
                .text(function(d){ return d.name; });

            entering.append("svg:clipPath")
                .attr("id", function(d){ return "clip-" + d.id; })
                .append("svg:path");

            triangles.exit().remove();

        this.updateTriangles();

        if (needsSelection) {
            this.selectFilter(this.params.id);
        }

        var bgs = svg.selectAll("g.background").select("path")
            .attr("fill", function(d) {
                return d.bgc = "#fff";
            }),
            flash = COLORS.flash;
        clearTimeout(this.animateTimeout);
        clearInterval(this.animateInterval);
        this.animateTimeout = setTimeout(_.bind(function(){
            this.animateInterval = setInterval(_.bind(function(){
                bgs.each(function(d, i){
                    if (d.xlr > 0) {
                        var on = (d.step % d.speed) == 0,
                            angle = d.triangle.angle;
                        // if (on) angle += ~~(1 - 2 * Math.random() - .5);
                        this.setAttribute("fill", (on ? flash : d.bgc) || "#fff");
                        this.setAttribute("transform", on
                            ? "scale(1.45) rotate("+angle+")"
                            : "scale(1.3) rotate("+angle+")");
                    }
                    d.step++;
                });
            }, this), 150);
        }, this), 1200);        

        /*
        // simpler data access for faster intervals
        var bgs = svg.selectAll("g.background")
            .select("path")[0].map(function(path, i) {
                return {
                    p: path,
                    d: path.__data__
                };
            }),
            len = bgs.length;
        clearTimeout(this.animateTimeout);
        clearInterval(this.animateInterval);
        this.animateTimeout = setTimeout(_.bind(function(){
            this.animateInterval = setInterval(_.bind(function(){
                for (var i = 0; i < len; i++) {
                    var o = bgs[i], path = o.p, d = o.d;
                    if (d.xlr > 0) {
                        var on = (d.step % d.speed) == 0,
                            angle = d.triangle.angle;
                        // if (on) angle += ~~(1 - 2 * Math.random() - .5);
                        path.setAttribute("fill", (on
                            ? COLORS.flash
                            : d.bgc) || "#fff");
                        path.setAttribute("transform", on
                            ? "scale(1.45) rotate("+angle+")"
                            : "scale(1.3) rotate("+angle+")");
                    }
                    d.step++;
                }
            }, this), 150);
        }, this), 1200);        
        */
    }
});


var Triangle = function(size, angle, center) {
    if (arguments.length > 0) this.size = size;
    if (arguments.length > 1) this.angle = angle;
    this.neighbors = new Array(3);
    this.center = center || {x: 0, y: 0};
};

Triangle.STEP_DEG = 120;
Triangle.STEP_RAD = deg2rad(Triangle.STEP_DEG);
Triangle.TRI_HEIGHT = 1/ Math.sqrt(3);

Triangle.prototype = {
    size: 100,
    angle: -90,
    neighbors: null,
    center: null,

    adjoin: function(neighbor, start) {
        var index = this.addNeighor(neighbor, start);
        if (index > -1) {
            neighbor.angle = this.getSlotAngle(index);
            neighbor.center = this.getSlotCenter(neighbor.angle, neighbor.size);
            var index = 1; // FIXME?
            if (neighbor.hasNeighborAt(index)) {
                throw "Can't occupy slot @ 1! (already occupied)";
            }
            neighbor.neighbors[index] = this;
            return true;
        } else {
            return false;
        }
    },

    hasNeighborAt: function(index) {
        return typeof this.neighbors[index] === "object";
    },

    hasFreeSlot: function() {
        for (var i = 0; i < 3; i++) {
            if (!this.hasNeighborAt(i)) {
                return true;
            }
        }
    },

    nextFreeSlot: function(start) {
        if (!start) start = 0;
        for (var i = start; i < start + 3; i++) {
            var index = i % 3; // wrap around
            if (!this.hasNeighborAt(index)) {
                return index;
            }
        }
        return -1;
    },

    getNeighborAt: function(index) {
        return this.neighbors[index];
    },

    addNeighor: function(neighbor, start) {
        var index = this.nextFreeSlot(start);
        if (index > -1) {
            this.neighbors[index] = neighbor;
            // TODO: orient?
            return index;
        } else {
            return -1;
        }
    },

    getSlotAngle: function(index) {
        return this.angle + Triangle.STEP_DEG * (index + .5);
    },

    getSlotCenter: function(angle, smallRadius) {
        return pol2car({
            t: deg2rad(angle),
            r: (this.size/2+smallRadius/2) + 25
        }, this.center);
    },

    points: function() {
        var center = {x: 0, y: 0};
        var a = 0; //deg2rad(this.angle),
            p = {t: a, r: this.size},
            step = Triangle.STEP_RAD,
            points = [];
        for (var i = 0; i < 3; i++) {
            points.push(pol2car(p, center));
            p.t += step;
        }
        return points;
    }
};

function deg2rad(deg) { return deg / 180 * Math.PI; }
function rad2deg(rad) { return rad / Math.PI * 180; }

function car2pol(p, center) {
    var c = center
        ? {x: p.x - center.x, y: p.y - center.y}
        : {x: p.x, y: p.y};
    return {
        t: Math.atan2(p.y / p.x),
        r: Math.sqrt(p.x * p.x + p.y * p.y)
    };
}

function pol2car(pol, center) {
    var offset = center || {x: 0, y: 0};
    var car = {
        x: Math.cos(pol.t) * pol.r + offset.x,
        y: Math.sin(pol.t) * pol.r + offset.y
    };
    return car;
}
/**
 * Paparazzi view
 */
Eddy.UI.Paparazzi = function() {
    Eddy.UI.View.apply(this, arguments);
};
_.extend(Eddy.UI.Paparazzi.prototype, Eddy.UI.View.prototype, {
    initialize: function(tracker, selector) {
        Eddy.UI.View.prototype.initialize.call(this, tracker, selector);
    },

    mode: "count",

    attach: function(selector) {
        Eddy.UI.View.prototype.attach.call(this, selector);
        
        this.d3 = d3.select(selector);

        this.viewBox = new Eddy.UI.ViewBox(0, 0, 800, 500);

        $("#nav ul").append(
            $("<li>").append(
                $("<a>").text("RECENT").attr("href","#paparazzi?mode=time")
            ).attr("class", "secondary time"),
            $("<li>").append(
                $("<a>").text("OVERALL").attr("href","#paparazzi?mode=count")
            ).attr("class", "secondary count")
        );
        var orientation = this.orientation;
        this.updateMode();
        this.selectedState = false;

        this.svg = this.d3.append("svg:svg")
            .style("width", "100%")
            .style("height", "100%")
            // .style("min-height",(orientation == 0) ? "175px" : "250px")
            .attr("viewBox", this.viewBox)
            .attr("preserveAspectRatio", "xMidYMin meet")
            .attr("id","svg")
            .style("margin","0 auto");

        this.d3.append("div").attr("id","papa-tweet");
        var retweet = this.d3.append("div").attr("id","retweeters");
            retweet.append("span").attr("class","count");
            retweet.append("span").attr("class","user-icons").append("span").attr("class","icons");
        this.d3.append("div").attr("id","back");

        var that = this;
        window.onorientationchange = function(){
            that.orientation = window.orientation;
            that.updateData();
            that.sizePhotos();
        };
        
        this.tracker.photos.bind("update", this.update, this);
    },

    updateMode: function() {
        var mode = this.mode;
        $("#nav li.secondary").each(function() {
            var li = $(this);
            li.toggleClass("selected", li.hasClass(mode));
        });
    },

    updateData: function(){
        var all = d3.selectAll("g.filter");
        if (!this.photos || this.photos.length == 0) return;

        var len = this.photos.length;
        var columns = [];
        var column = [];
        var row = 1;
        for (var i = 0; i < len; i++){
            column.push(all[0][i]);
            if (column.length == row || i == len-1){
                row++;
                columns.push(column);
                column = [];
            }
        }
        var x = [];
        var HEI = this.viewBox.height-50;
        var WID = this.viewBox.width;
        var width = 0;
        for (var i = 0; i < columns.length; i++){
            width += (HEI/(i+1))/1.3388 + ((i == 0 || this.mobile) ? 0 : 10);
            x.push(width);
        }
        this.areaWidth = width;
        for (var i = 0; i < columns.length; i++){
            for (var j = 0; j < columns[i].length; j++){
                var f = columns[i][j];
                d3.select(f).each(function(d){
                    d.height = HEI/(i+1);
                    d.width = (HEI/(i+1))/1.3388;
                    d.x = width - x[i];
                    d.y = (j)*HEI/(i+1);
                });
            }
        }
    },

    sizePhotos: function(){
        var prop = this.mode == "time"
            ? "time"
            : "retweet_total";
        this.svg.selectAll("g.filter").sort(function(a,b){
                return b[prop] - a[prop];
            }).each(function(d,i){
                d.rank = i+1;
            });
        this.updateData();
        this.updateImages();
    },

    updateImages: function(){
        if (this.selectedState) return;
        var WID = this.viewBox.width;
        var width = this.areaWidth;
        this.svg.selectAll("g.filter").transition().duration(500)
            .attr("transform",function(d,i){ return "translate("+((WID-width)/2 + d.x)+","+d.y+")"; })
            .select(".rank-number")
            .text(function(d,i){ return i+1; });
                    
        this.svg.selectAll("g.filter").select(".photo")
            .attr("height",function(d){ return d.height + "px"; })
            .attr("width", function(d){ return  d.width + "px"; })
            .attr("preserveAspectRatio","xMidYMid slice");
    },

    setParams: function(params) {
        Eddy.UI.View.prototype.setParams.call(this, params);

        console.log('params',this.params, this.params.id, this.params.mode);
        if (this.params.id && !this.selectedState) {
            console.log("selecting");
            this.selectedState = true;
            this.selectPhoto(this.params.id);
            this.sizePhotos();
            } else if (this.selectedState && !(this.params.id || this.params.mode)){
                this.selectedState = false;
            }
        if (this.params.mode && this.params.mode != this.mode && !this.selectedState) {
            this.mode = this.params.mode;
            this.updateMode();
            // this.updateData();
            this.sizePhotos();
        }
    },

    selectPhoto: function(id) {
        if (id == null) return;
        if (this.selectedId) {
            this.selectedId.on("click", null);            
        }
        var HEI = (this.mobile) ? 300 : this.viewBox.height;
        var WID = this.viewBox.width;
        var width = this.areaWidth;
        var viewHeight = $("#view").height();
        var windowWidth = $(window).width();
        var selectedWidth = HEI/1.3388;
        var mobile = (this.mobile || this.ipad); 
        this.selectedId = d3.select("g#photo-"+id);
        var baseURL = this.tracker.loader.baseURL;
        var selectedRank = parseInt(this.selectedId.select(".rank-number").text());

        console.log("id",id,this.selectedId);

            d3.selectAll("g.filter").attr("opacity","0");

            d3.select("g#photo-"+id+".filter").each(function(d){
                $("#papa-tweet").empty().append(
                    $("<div>").attr("class","tweet").html('Retweet at <a href="http://twitter.com/mtv">twitter.com/mtv</a>')
                );
                $("#retweeters .count").text(d.retweet_total + " Retweets");
                for (var i = 0; i < d.icons.length; i++){
                    var icon = d.icons[i];
                    if (icon && icon.indexOf("http") != 0) icon = baseURL + icon;
                    $("#retweeters .user-icons .icons").append(
                        $("<img>").attr("src", icon)
                        .attr("height",(mobile) ? "48px" : "58px").attr("width",(mobile) ? "48px" : "58px")
                    );
                }
            });

        var aspectRatio = this.viewBox.width/this.viewBox.height;
        $('#photo-'+id).parent().append($('#photo-'+id));
        var pageMargins = this.size.x - $("#view").height()*aspectRatio;
        var leftMargin = pageMargins/2 + viewHeight/1.3388;
        
        $("#papa-tweet").css("left", (mobile) ? "auto" : (leftMargin + "px"))
            .css("width",(mobile) ? "100%" : (windowWidth-leftMargin + "px"));
        
        $("#retweeters").css("left",(mobile) ? "auto" : (leftMargin + "px"))
            // .css("top",(mobile) ? "305px" : $("#papa-tweet").height())
            .css("width", (mobile) ? "100%" : $("#papa-tweet").width());

        if (!mobile){ 
            $("#retweeters").css("top",$("#papa-tweet").height()); 
        } else if (this.iphone){ 
            $("#retweeters").css("top","305px"); 
        } else if (this.ipad){ 
            $("#retweeters").css("top", "490px"); 
        } 

        var back = $("#back").text((mobile) ? "back >>" : "<< back")
                        .css("background-color",COLORS.teal)
                        .css("right",(mobile) ? "0px" : "auto")
                        .css("left",(mobile) ? "auto" : (pageMargins/2-110 + "px"));
//(mobile) ? (this.iphone ? "translate(50,0.1)" : "translate(200,0.1)") : "translate(0,0.1)");}) 
        //actual selected one
        this.selectedId.attr("class","filter highlighted");
        d3.select("g#photo-"+id)
            // .transition().duration(500)
            .attr("transform","translate(0.1,0.1)")
            .attr("opacity","1");
        
        d3.select("g#photo-"+id)
            .select(".photo")
                .attr("height",(mobile) ? (420*1.3388 + "px") : (HEI + "px"))
                .attr("width", (mobile) ? "420px" : (selectedWidth + "px"));
        
        // reset
        d3.select("#back").on("click", function(d, i){
            back.empty();
            location.hash = "#paparazzi"

            d3.selectAll("g.filter").transition().duration(500)
                .attr("opacity","1");
            d3.selectAll("g.highlighted").each(function(d){
                d3.select(this).attr("class","filter")
                .transition().duration(500)
                .attr("transform",function(d,i){ return "translate("+((WID-width)/2 + d.x)+","+d.y+")"; })
                .attr("opacity","1")
                .select("a")
                    .attr("href",function(d){ return makeURL("paparazzi", {id: d.id}); })
                .select(".photo")
                    .attr("height",function(d){ return d.height + "px"; })
                    .attr("width", function(d){ return  d.width + "px"; });
            });
            $("#retweeters .count").empty();
            $("#retweeters .user-icons .icons").empty();
            $("#papa-tweet").empty();
        });
    },

    detach: function() {
        this.svg.remove();
        this.svg = null;
        this.d3 = null;
        $("#papa-tweet").remove();
        $("#retweeters").remove();
        $("#back").remove();
        Eddy.UI.View.prototype.detach.call(this);
        $("#nav li.secondary").remove();
        this.tracker.photos.unbind("update", this.update, this);
    },

    update: function(updates) {
        var photos = this.photos = this.tracker.photos.models.map(function(photo) {
            var data = photo.toJSON();
            data._model = photo;
            return data;
        });

        var images = this.svg.selectAll("g.filter")
            .data(photos, function(photo){
                return photo ? photo.id : null;
            });
        var entering = images.enter().append("svg:g")
            .attr("class","filter")
            .attr("id",function(d){ return "photo-"+d.id; });

        entering.append("svg:a")
            .attr("class","thelink")
            .attr("xlink:href",function(d){ return makeURL("paparazzi", {id: d.id}); })
            .append("svg:image")
            .attr("class","photo")
            .attr("xlink:href",function(d,i){ return d.photo_url; });
        
        entering.append("svg:rect")
            .attr("class","rank")
            .attr("height", 30)
            .attr("width", 30)
            .attr("fill", COLORS.pink);
        entering.append("svg:text")
            .attr("class","rank-number")
            .attr("fill","white")
            .attr("text-anchor", "middle")
            .attr("y", 25)
            .attr("x", 15);

        this.sizePhotos();
    }
});

/**
 * Hot Seat view
 */
Eddy.UI.HotSeat = function() {
    Eddy.UI.View.apply(this, arguments);
};

Eddy.UI.HotSeat.SEATS_SVG = "data/seats.svg";
Eddy.UI.HotSeat.SEATS_CSV = "data/seats.csv";

_.extend(Eddy.UI.HotSeat.prototype, Eddy.UI.View.prototype, {
    attach: function(selector) {
        Eddy.UI.View.prototype.attach.call(this, selector);

        this.d3 = d3.select(selector);

        if (this.root) {
            this.d3.append(this.root.node());
        } else {
            this.root = this.d3.append("object")
                .attr("data", Eddy.UI.HotSeat.SEATS_SVG)
                .style("width", "100%")
                .style("height", (this.mobile) ? "300%" : "100%")
                .style("visibility", "hidden");
        }

        var tweet = this.d3.append("div")
            .attr("id", "seat-tweet");
        var buttons = tweet.selectAll(".arrow")
            .data(["next", "prev"]).enter().append("a")
                .attr("class", function(d, i) {
                    return "arrow " + d;
                })
                .text(function(d, i) {
                    return (d == "prev") ? "<<" : ">>";
                });
        this.$tweet = $("#seat-tweet");

        var that = this;
        buttons.on("click", function(d, i) {
            switch (d) {
            case "next":
                that.nextTweet();
                break;
            case "prev":
                that.prevTweet();
                break;
            }
        });

        this.tracker.users.bind("change:recent_tweet", this.changeRecent, this);
        this.tracker.users.bind("update", this.update, this);
        this.checkLoaded();
    },

    changeRecent: function(model, tweet) {
        this.stopPopping();

        var id = model.id;
        // console.log("change recent:", id, model, tweet);
        var data = this.seatMap[id];
        if (data && data.node) {
            d3.select(data.node).each(this.pop);
        }

        this.startPopping(2500);
    },

    prevTweet: function() {
        var i = this.tweets.index,
        i = (i == 0)
            ? this.tweets.length - 1
            : i - 1;
        this.showTweet(this.tweets[i]);
        this.tweets.index = i;
    },

    nextTweet: function() {
        var i = this.tweets.index;
        i = (i == this.tweets.length - 1)
            ? 0
            : i + 1;
        this.showTweet(this.tweets[i]);
        this.tweets.index = i;
    },

    showTweet: function(tweet) {
        var div = formatTweet(tweet);
        this.$tweet.find(".tweet").remove();
        this.$tweet.prepend(div);
    },

    checkLoaded: function() {
        if (this.svgLoaded) {
            if (this.seatNodes) {
                // console.log("checkLoaded(): all set, updating!");
                this.update({});
                this.setParams(this.params || {});
                this.root.style("visibility", null);
                return true;
            } else {
                d3.csv(Eddy.UI.HotSeat.SEATS_CSV, _.bind(this.onSeatsLoaded, this));
                // console.log("LOADED SVG!", this.svg);
                return false;
            }
        } else {
            this.root.node().addEventListener("load", _.bind(this.onSVGLoad, this), false);
            return false;
        }
    },

    onSVGLoad: function(e) {
        // console.log("onSVGLoad():", e ? e.target : null);
        if (this.svgLoaded) return;

        // Firefox wants the object target, not the root node for some reason
        this.svgDoc = this.root.node().contentDocument;
        d3.select(this.svgDoc).select("#seats").style("display", "none");
        var container = this.$container;
        this.svgDoc.addEventListener("click", function(e) {
            container.trigger("click");
        });

        this.svg = this.svgDoc.firstChild;
        $(this.svg).bind("keydown", function(e) {
            // console.log(document);
            $(window).triggerHandler("keydown", [e]);
        });
        this.flipped = this.svg.getAttribute("class") == "flipped";
        // console.log(this.svg.getAttribute("class"), this.flipped);
        this.svgLoaded = true;

        this.checkLoaded();
    },

    seatMap: {},
    onSeatsLoaded: function(rows) {
        var len = rows.length,
            map = {};
        var getNode = _.bind(function(id) {
           return this.svgDoc.getElementById(id);
        }, this);
        for (var i = 0; i < len; i++) {
            var row = rows[i],
                handle = row["Twitter Handle"],
                name = row["Name"] || handle,
                seat = row["Seat"],
                node = getNode(seat);
            // console.log("row", [seat], ":", name, handle, node);
            if (node && !handle) {
                // node.setAttribute("r", 3);
            }
            if (!handle) {
                continue;
            }
            if (node) {
                map[handle] = seat;
                node.setAttribute("class", "occupied");
                // XXX: note that we're doing the data mapping by hand here
                this.seatMap[handle] = node.__data__ = {
                    name: name,
                    handle: handle,
                    seat: seat,
                    node: node
                };
            } else {
                // console.warn("no match for:", seat);
            }
        }

        var svg = d3.select(this.svg),
            seats = svg.select("#seats"),
            circles = svg.selectAll("circle.occupied");
        circles.each(function(d, i) {
            var node = d3.select(this);
            var g = seats.append("svg:g")
                .attr("transform","translate("+node.attr("cx")+","+node.attr("cy")+")")
                .attr("id","g-"+node.attr("id"));

            node.attr("cx","0").attr("cy","0");
            g.node().appendChild(this);
        });

        var R = 4;
        this.seatNodes = svg.selectAll("circle.occupied")
            .attr("r", 4)
            .each(function(d, i) {
                d.r = R;
            });

        var focus = this.focus,
            blur = this.blur,
            flipped = this.flipped;
        this.seatNodes.on("mouseover",function(d, i){
            var g = d3.select(this.parentNode);
            focus.call(this, d, i);
        });

        this.seatNodes.on("click", function(d,i) {
            var url = makeURL("hotseat", {id: d.handle});
            // console.log("click:", this, d.user, "->", url);
            window.location = url;
        });

        // TODO: dismiss with a click?

        this.seatNodes.on("mouseout", function(d,i) {
            blur.call(this, d, i);
        });

        d3.select(this.svgDoc).select("#seats").style("display", null);
        this.checkLoaded();
        this.startPopping(0);
    },

    startPopping: function(delay) {
        clearTimeout(this.popDelay);
        if (delay) {
            return this.popDelay = setTimeout(_.bind(this.startPopping, this), delay);
        }
        var nodes = this.seatNodes[0].sort(function(a, b) {
                return Math.random() - .5;
            }),
            len = nodes.length,
            i = 0,
            node = nodes[i];
        // console.log("popping:", nodes.length, "nodes:", nodes);

        clearInterval(this.popInterval);
        this.popInterval = setInterval(_.bind(function() {
            d3.select(node).each(this.pop);
            var n = 0;
            node = nodes[++i % len];
        }, this), 60000 / nodes.length);

        clearInterval(this.sortInterval);
        this.sortInterval = setInterval(function() {
            nodes = nodes.sort(function(a, b) {
                return Math.random() - .5;
            });
            /*
            nodes.forEach(function(node) {
                d3.select(node).find(".ping").filter(function() {
                    return parseFloat(this.getAttribute("r")) < .1;
                }).remove();
            });
            */
        }, 10000);
        this.popping = true;
    },

    stopPopping: function() {
        this.popping = false;
        clearInterval(this.sortInterval);
        clearInterval(this.popInterval);
        clearTimeout(this.popDelay);
    },

    pop: function(d, i) {
        // console.log("pop:", d);
        if (d && d.user) {
            var r = d.r * 20;
            // console.log("pop!", d.handle, r);
            if (!d.selected && !d.focus) {
                d3.select(this)
                    .attr("r", d.r * 2)
                    .transition().duration(200)
                        .attr("r", d.r);
            }

            d3.select(this.parentNode).append("svg:circle")
                .attr("class", "ping")
                .attr("r", 0)
                .attr("fill", "none")
                .attr("stroke", COLORS.teal)
                .attr("stroke-width", d.r * 1.5)
                .attr("opacity", 1)
                .transition().duration(r * 50).ease("circle-out")
                    .attr("r", r)
                    .attr("stroke-width", 0)
                    .attr("opacity", .01)
                    .remove();
        } else {
            // console.log("no pop:", d);
        }
    },

    focus: function(d, i) {
        // move to front
        this.parentNode.parentNode.appendChild(this.parentNode);

        var circle = d3.select(this);
        circle.transition().duration(50)
            .attr("fill", COLORS.pink)
            .attr("r", 8);

        var callout = d3.select(this.parentNode)
            .append("svg:g")
                .attr("class", "callout")
                .style("pointer-events","none");

        callout.append("svg:polygon")
            .attr("points","0,0 -10,-17, 20,-17")
            .attr("fill","#666");
        var name = callout.append("svg:text")
            .text(d.name) 
            .attr("x", -12)
            .attr("y", -24);

        var textWidth = name.node().getBBox().width;
        callout.insert("svg:rect","text")
            .attr("width", textWidth + 15)
            .attr("height", 2)
            .attr("x", -20)
            .attr("y", -17)
            .attr("fill","#000");
        callout.insert("svg:rect","text")
            .attr("width", textWidth + 15)
            .attr("height","30")
            .attr("x", -20)
            .attr("y", -47)
            .attr("fill", COLORS.teal);

        d.focus = true;
    },

    blur: function(d, i) {
        var node = d3.select(this);
        if (!d.selected) {
            d3.select(this.parentNode)
                .select(".callout").remove();
        }
        node.transition().duration(50)
            .attr("fill", "#fff")
            .attr("r", d.r);
        d.focus = false;
    },

    select: function(d, i) {
        console.log("select:", d.name, d.selected);
        this.parentNode.parentNode.appendChild(this.parentNode);

        d3.select(this.parentNode.parentNode.parentNode)
            .select(".callout")
            .remove();

        d3.select(this)
            .transition().duration(100)
            .attr("fill", COLORS.pink)
            .attr("r", 10);

        var circle = d3.select(this);
        circle.transition().duration(50)
            .attr("fill", COLORS.pink)
            .attr("r", 8);

        var par = d3.select(this.parentNode),
            callout = par.append("svg:g")
                .attr("class","callout")
                .style("pointer-events","none");

        callout.append("svg:polygon")
            .attr("points","0,0 -10,-17, 20,-17")
            .attr("fill","#666");
        var name = callout.append("svg:text")
            .text(d.name) 
            .attr("x", -12)
            .attr("y", -24);

        var textWidth = name.node().getBBox().width;
        callout.insert("svg:rect","text")
            .attr("width", textWidth + 15)
            .attr("height", 2)
            .attr("x", -20)
            .attr("y", -17)
            .attr("fill","#000");
        callout.insert("svg:rect","text")
            .attr("width", textWidth + 15)
            .attr("height","30")
            .attr("x", -20)
            .attr("y", -47)
            .attr("fill", COLORS.teal);

        d.selected = true;
    },

    unselect: function(d, i) {
        if (d.selected) console.log("unselect:", d.name);
        d3.select(this)
            .transition().duration(100)
            .attr("fill", "#fff");
        d3.select(this.parentNode)
            .select(".callout").remove();
        d.selected = false;
    },

    setParams: function(params) {
        Eddy.UI.View.prototype.setParams.call(this, params);
        this.selectUser(this.params.id);
    },

    getHotRodId: function(name) {
        return Eddy.Model.FilterList.prototype.getId({name: name});
    },

    selectUser: function(id) {
        if (!this.seatNodes) return false;

        var data = this.seatMap[id];
        console.log("id:", id, "->", data);
        if (!data) {
            console.warn("no good, checking hotrod ids...");
            for (var handle in this.seatMap) {
                var hrid = this.getHotRodId(this.seatMap[handle].name);
                console.log(handle, "->", hrid, "?");
                if (hrid == id) {
                    data = this.seatMap[handle];
                    break;
                }
            }
        }

        var that = this;
        this.seatNodes.each(function(d, i) {
            if (d == data && !d.selected) {
                // if (that.ontv) that.focus.call(this, d, i);
                that.select.call(this, d, i);
            } else if (d.selected) {
                // if (that.ontv) that.blur.call(this, d, i);
                that.unselect.call(this, d, i);
            }
        });

        this.$tweet.hide()
            .find(".tweet").remove();

        if (data && data.user && data.user.tweets.length) {

            if (this.ontv) {
                this.showTweet(data.user._model.get("recent_tweet"));
            } else {
                this.listTweets(data.user.tweets);            
            }

        } else if (data) {
            console.warn("not found:", data);

            /*
            var handle = data.handle,
                name = data.name;
            try {
                var t = $("<div>").addClass("tweet"),
                    a = $("<p>").addClass("author").appendTo(t);
                a.append(
                    $("<a>").attr("href", "http://twitter.com/intent/user?screen_name=" + handle)
                        .text(name),
                    $("<p>").addClass("text")
                        .text("loading...")
                );
                this.$tweet.prepend(t).show()
                    .find(".arrow").hide();

                this.tweets = null;
                $.ajax("https://api.twitter.com/1/statuses/user_timeline.json", {
                    data: {
                        screen_name: handle,
                        count: 3
                    },
                    dataType: "jsonp",
                    success: _.bind(function(data) {
                        if (!this.tweets) {
                            console.log("LOADED", data);
                            that.listTweets(data.map(twitter2eddy));
                        }
                    }, this)
                });

            } catch (e) {
                console.error("blargh:", e);
            }
            */

        } else {
            // XXX
        }
    },

    listTweets: function(tweets) {
        if (tweets && tweets.length > 0) {
            this.tweets = tweets;

            var i = this.tweets.index = 0;
            this.showTweet(tweets[i]);

            if (tweets.length > 1) {
                this.$tweet.find(".arrow").show();
            } else {
                this.$tweet.find(".arrow").hide();
            }
            this.$tweet.show();
        } else {
            this.tweets = null;
            this.$tweet.find(".arrow").hide();
        }
    },

    detach: function() {
        this.stopPopping();

        this.root.remove();
        this.d3 = null;
        this.$tweet.remove();
        this.$tweet = null;

        this.tracker.users.unbind("change:recent_tweet", this.changeRecent, this);
        this.tracker.users.bind("update", this.update, this);
        Eddy.UI.View.prototype.detach.call(this);
    },

    update: function(updates) {
        var users = this.tracker.users.models.map(function(user) {
            var data = user.toJSON();
            data._model = user;
            return data;
        });

        for (var i = 0; i < users.length; i++) {
            var user = users[i],
                data = this.seatMap[user.id];
            if (data) {
                data.user = user;
            }
        }

        if (this.seatNodes) {
            this.seatNodes
                .attr("fill", function(d, i) {
                    return d.user ? "#fff" : "#333";
                });
        }
    }
});

/**
 * Timeline view
 */
Eddy.UI.Timeline = function() {
    Eddy.UI.View.apply(this, arguments);
};

_.extend(Eddy.UI.Timeline.prototype, Eddy.UI.View.prototype, {
    /**
     * The Timeline view binds to the tracker's timeline update events.
     */
    initialize: function(tracker, selector) {
        // bind event listeners
        this.onKeyPress = _.bind(this.onKeyPress, this);
        this.onMouseDown = _.bind(this.onMouseDown, this);
        this.onClick = _.bind(this.onClick, this);

        this.timeline = tracker.timeline;
        Eddy.UI.View.prototype.initialize.call(this, tracker, selector);
    },

    /**
     * attach() inserts an SVG chart into the DOM and stores references to all
     * of its requisite compontents.
     */
    attach: function(selector) {
        this.d3 = d3.select(selector);

        // chart SVG root
        this.chart = this.d3.append("svg:svg")
            .attr("width", "100%")
            .attr("height", "100%");

        var that = this,
            href = "http://twitter.com/intent/tweet";
        this.prompt = this.d3.append("a")
            .attr("id", "tweet-prompt")
            .attr("href", href)
            .attr("target", "_blank")
            .text("TWEET #VMA")
            .on("click", function() {
                var total = that.totalText.text();
                this.href = $.param.querystring(href, {
                    text: total + " #VMA tweets and counting!",
                    url: location.href,
                    via: "mtv"
                });
            });

        // background (for catching mouse events)
        this.chart.append("svg:rect")
            .attr("class", "bg")
            .attr("fill", "black")
            .attr("fill-opacity", 0)
            .attr("width", "100%")
            .attr("height", "100%");

        // XXX: we use jQuery here because we need an event to cancel
        var $svg = $(this.chart.node())
            .css("cursor", "col-resize")
            .bind("mousedown", this.onMouseDown)
            .bind("click", this.onClick);

        var radii = [14, 10, 7, 3];

        this.bullseye = this.chart.append("svg:g")
            .attr("class", "bullseye")
            // hide it by default
            .attr("display", "none");

        this.bullseye.selectAll("circle")
            .data(radii).enter().append("svg:circle")
                .attr("r", function(d, i) { return d; })
                .attr("fill", function(d, i) { return (i % 2 == 0) ? "#fff" : COLORS.pink; });

        this.bullseye.append("svg:text")
            .attr("class", "goal")
            .attr("x", radii[0] + 7)
            .attr("y", 2)
            .attr("alignment-baseline", "middle")
            .attr("fill", COLORS.pink);

        // bars for counts
        this.counts = this.chart.append("svg:g")
            .attr("class", "counts")

        this.labels = this.chart.append("svg:g")
            .attr("class", "labels");

        var tcon = this.chart.append("svg:g")
            .attr("class", "totals");

        this.points = tcon.selectAll("circle")
            .data(["first", "last"]).enter().append("svg:circle")
            .attr("class", "point")
            .attr("r", 0)
            .attr("fill", function(d, i) {
                return (d == "first") ? COLORS.teal : "#848484";
            });

        // line for totals
        this.totals = tcon.selectAll("path")
            .data(["bg", "fg"]).enter().append("svg:path")
            .attr("class", "totals")
            .attr("fill", "none")
            .attr("stroke", function(d, i) {
                return (d == "fg") ? COLORS.teal : "#999";
            })
            /*
            .attr("stroke-dasharray", function(d, i) {
                return (d == "fg") ? null : "4,3";
            })
            */
            .attr("stroke-width", function(d, i) {
                return (d == "fg") ? 3 : 1.5;
            });

        tcon.select("path:first-child")
            .attr("clip-path", "url(#clip-future)");
        tcon.select("path:last-child")
            .attr("clip-path", "url(#clip-past)");

        this.clippers = tcon.selectAll("clipPath")
            .data(["past", "future"]).enter().append("svg:clipPath")
                .attr("class", "clipper")
                .attr("id", function(d, i) { return "clip-" + d; });

        this.clippers.append("svg:rect")
            .attr("x", function(d, i) {
                return (d == "past") ? -5000 : 0;
            })
            .attr("width", 5000)
            .attr("height", 500);

        this.cursor = this.chart.append("svg:g")
            .attr("class", "cursor")
        this.cursor.append("svg:rect")
            .attr("x", this.barWidth / 2)
            .attr("width", "100%")
            .attr("height", 500)
            .attr("fill", "#000")
            .attr("fill-opacity", .5);

        var total = this.cursor.append("svg:g")
            .attr("class", "label");

        total.append("svg:circle")
            .attr("r", 0)
            .attr("fill", COLORS.teal);

        var bits = total.append("svg:g")
            .attr("class", "bits");

        var stage = $("body").hasClass("stage");

        this.totalText = bits.append("svg:text")
            .attr("class", "count")
            .attr("alignment-baseline", "middle")
            .attr("x", 9)
            .attr("y", stage ? 10 : 5)
            .attr("fill", COLORS.teal);

        bits.append("svg:text")
            .attr("class", "tweets")
            .attr("x", 10)
            .attr("y", stage ? 33 : 35)
            .attr("fill", COLORS.teal)
            .text("TWEETS ")
            .style("display", "none")
            .append("svg:tspan")
                .attr("class", "since");

        this.rateText = bits.append("svg:text")
            .attr("class", "rate")
            .attr("x", 10)
            .attr("y", 52)
            .attr("fill", COLORS.teal);

        $(window).bind("keydown", this.onKeyPress);
        this.timeline.bind("update", this.update, this);
        Eddy.UI.View.prototype.attach.call(this, selector);
    },

    keepFit: function() {
        var timeline = this,
            svg = timeline.$container.find("svg")
                .attr("width", null)
                .attr("height", null),
            w = svg.width(),
            h = timeline.$container.height();

        $(window).bind("resize", function() {
            timeline.setSize(w, h);
        }).trigger("resize");
     },

    /**
     * detach() unbinds the timeline update handler and chart mouse events and
     * removes the chart from the DOM. We also cancel the tick interval with
     * stopTicking().
     */
    detach: function() {
        $(window).unbind("keydown", this.onKeyPress);
        this.timeline.unbind("update", this.update);
        $(this.chart.node())
            .unbind("mousedown", this.onMouseDown)
            .unbind("click", this.onClick)
            .remove();
    },

    stepBy: function(delta) {
        // FIXME: hard-coded step
        this.selectTime(this.selectedTime + 60 * delta);
    },

    onKeyPress: function(e, custom) {
        // console.log("press:", e.keyCode, e.shiftKey, e);
        if (!e.keyCode && typeof custom == "object") {
            e = custom;
            console.warn("custom event:", custom.keyCode, custom);
        }
        var m = e.shiftKey ? 10 : 1;
        switch (e.keyCode) {
            case 37: // LEFT
                this.stepBy(-1 * m);
                break;
            case 36: // PAGE_UP
            case 38: // UP
                this.stepBy(1000);
                break;
            case 39: // RIGHT
                this.stepBy(+1 * m);
                break;
            case 35: // PAGE_DOWN
            case 40: // UP
                this.selectTime(this.timeframe.get("start_time"));
                break;
        }
    },

    /**
     * Every time the "_total" attribute of the last checkpoint changes, update
     * the running total text accordingly.
     */
    onLastChange: function(model, total, changed) {
        if (model.get("time") == this.selectedTime) {
            this.totalText
                .text(this.formatTotal(Math.round(total)));
        } else {
            // console.warn(model.get("time"), "!=", this.selectedTime);
        }
    },

    /**
     * getTimeX() returns the x coordinate for a given timestamp in epoch
     * seconds.
     */
    getTimeX: function(time) {
        var x = this.xScale(time),
            range = this.xScale.range();
        return Math.max(range[0], Math.min(x, range[1]));
    },

    // selected time
    selectedTime: null,
    /**
     * sets selectedTime and updates all of the corresponding UI.
     * TODO: trigger an event here?
     */
    selectTime: function(time, duration, force) {
        if (this.selectedTime != time || force) {
            this.selectedTime = time;
            this.updateSelectedTime(duration);
            return true;
        }
        return false;
    },

    /**
     * Updates the UI according to the selectedTime over an optional transition
     * duration.
     *
     * NOTE: this.selectedTime gets modified in this function if it's out of
     * the bounds of the current timeframe.
     */
    updateSelectedTime: function(duration) {
        if (!this.timeframe) return false;
        var time = this.selectedTime,
            timeframe = this.timeframe,
            step = timeframe.getTimeStep(time);
        // console.log("updateSelectedTime():", time, "->", step);

        step = Math.max(0, Math.min(step, this.checks.length - 1));
        time = timeframe.getTimeAt(step);
        // console.log("step:", step, "time:", time);

        var changed = false;
        if (time != this.selectedTime || step != this.selectedIndex) {
            changed = true;
            try {
                this.trigger("change", time, step);
            } catch (e) {
                console.warn("error while triggering 'change':", e);
            }
        }
        // XXX: note: we "fix" the time here
        this.selectedTime = time;
        this.selectedIndex = step;

        var x = this.getTimeX(time),
            transform = "translate(" + x + ",0)";

        var trans = this.transitioner(duration);
        trans(this.cursor)
            .attr("transform", transform);
        trans(this.clippers.selectAll("rect"))
            .attr("transform", transform);

        var check = this.checks[step],
            total = check.running_total,
            rate = check.count,
            y = this.totals.yScale(total);

        var label = this.cursor.select(".label"),
            bits = label.select(".bits"),
            rect = bits.node().getBBox();

        var offset = this.size.y - (y + rect.y + rect.height);
        offset = Math.min(0, offset);
        bits.attr("transform", "translate(0," + offset + ")");

        trans(label)
            .attr("transform", "translate(0," + y + ")");
        if (changed) {
            this.totalText
                .text(this.formatTotal(check.show_total));
        }

        this.rateText
            .text(this.formatTotal(rate) + "/MIN @ " +
                  TIME_FORMAT(new Date(time * 1000)));

        this.chart.selectAll(".counts rect")
            .attr("fill", function(d, i) {
                if (d.time == check.time) {
                    this.parentNode.appendChild(this);
                    return "#fff";
                }
                return "#666";
            });

        var lastInBounds = this.inBounds;
        if (lastInBounds != check.in_bounds) {
            // console.log("timeframe:", timeframe.id, [start, end]);
            var tf = check.in_bounds
                ? this.timeframe
                : this.timeline.runningTotalTimeframe,
                since = tf.get("start_time");
            this.cursor.select(".tweets")
                .style("display", null);
            this.cursor.select(".since")
                .text("SINCE " + HOUR_FORMAT(new Date(since * 1000)).toUpperCase());
            this.lastInBounds = check.in_bounds;
        }
    },

    // keep track of whether the mouse has moved or not
    hasMoused: false,
    onMouseDown: function(e) {
        // mover is where we listen for "mousemove" events...
        var mover = $(this.chart.node()),
            // and shaker is where we listen for "mouseup" events
            shaker = $(document);

        // we delay a call to the "mousemove" handler with the down event
        var downer = setTimeout(_.bind(function() {
            clearTimeout(downer);
            mousemove(e);
        }, this), 200);

        // and we bind our "mouseup" handler to this, which performs the
        // final time selection
        var mouseup = _.bind(function(e) {
            clearTimeout(downer);
            this.onMouseUp(e);
            mover.unbind("mousemove", mousemove);
            shaker.unbind("mouseup", mouseup);
        }, this);

        // we bind our "mousemove" handler to this as well
        var mousemove = _.bind(function(e) {
            clearTimeout(downer);
            this.onMouseMove(e);
            this.hasMoused = true;
        }, this);

        mover.bind("mousemove", mousemove);
        shaker.bind("mouseup", mouseup);
    },

    /**
     * Cancel mouseup events.
     */
    onMouseUp: function(e) {
        if (e) e.preventDefault();
        return false;
    },

    /**
     * mousemove events trigger a time selection of the time corresponding to
     * the mouse's x position.
     */
    onMouseMove: function(e) {
        var time = this.getMouseTime(e);
        if (!isNaN(time) && isFinite(time)) {
            this.selectTime(time);
        }
    },

    /**
     * click events trigger a time selection too.
     */
    onClick: function(e) {
        var time = this.getMouseTime(e);
        if (!isNaN(time) && isFinite(time)) {
            this.selectTime(time);
        }
    },

    /**
     * Get the timestamp corresponding to the x position of either the provided
     * event object (e) or d3's SVG mouse coordinate.
     */
    getMouseTime: function(e) {
        if (!this.xScale) return null;
        try {
            // XXX: this assumes the SVG is 100% of the container's size
            var offset = $(this.chart.node()).offset(),
                pos = e
                    ? [e.pageX - offset.left, e.pageY - offset.top]
                    : d3.svg.mouse(this.chart.node());
            // console.log("getMouseTime(): pos =", pos, "e =", e);
        } catch (error) {
            console.error("unable to get mouse position:", error);
            return null;
        }
        var x = pos[0],
            domain = this.xScale.domain();
        return Math.max(domain[0], Math.min(~~this.xScale.invert(x), domain[1]));
    },

    // total text formatting function
    formatTotal: d3.format(",d"),

    // padding (top, right, bottom, left) in pixels
    padding: [23, 178, 8, 8],
    // width of count bars in pixels
    barWidth: 3,

    /**
     * Get the inner bounds of the chart itself as an SVGRect, relative to the
     * SVG root and taking this.padding into account.
     */
    getChartRect: function() {
        var node = this.chart.node(),
            rect = node.createSVGRect();
        if (this.padding instanceof Array) {
            var pad = this.padding;
            rect.x = pad[3];
            rect.y = pad[0];
            rect.width = this.size.x - (pad[1] + pad[3]);
            rect.height = this.size.y - (pad[0] + pad[2]);
        } else {
            var pad = (typeof this.padding === "object")
                ? this.padding
                : {x: this.padding, y: this.padding};
            rect.x = pad.x;
            rect.y = pad.y;
            rect.width = this.size.x - pad.x * 2;
            rect.height = this.size.y - pad.y * 2;
        }
        return rect;
    },

    /**
     * resize the chart.
     */
    resize: function() {
        var rect = this.getChartRect(),
            W = rect.width,
            H = rect.height,
            L = rect.x,
            R = rect.x + W,
            T = rect.y,
            B = rect.y + H,
            B2 = B + this.padding[2];

        this.prompt
            .style("left", ~~(R + 2) + "px");

        this.bullseye
            .attr("transform", "translate(" + [R, T] + ")");

        if (!this.checks || !this.xScale) {
            return false;
        }

        var len = this.checks.length,
            bw = this.barWidth,
            // width of a single bar
            ww = Math.ceil(W / len);

        var xx = this.xScale
                .range([L, R]);
            hh = this.counts.yScale
                .range([0, H]);

        this.counts.selectAll("rect")
            .attr("width", bw)
            .attr("height", function(d, i) {
                return d.height = hh(d.count);
            })
            .attr("x", function(d, i) {
                return xx(d.time) - bw / 2;
            })
            .attr("y", function(d, i) {
                return B2 - d.height;
            });

        // dy scale
        var dy = this.totals.yScale
            .range([B, T]);

        var lineScale = this.totals.lineScale
            .x(function(d, i) {
                return xx(d.time);
            })
            .y(function(d, i) {
                return dy(d.running_total);
            });

        this.points
            .attr("cx", function(d, i) {
                return xx.range()[i];
            })
            .attr("cy", function(d, i) {
                return dy.range()[i];
            });

        this.totals.attr("d", lineScale(this.totals.points));

        var dateFormat = d3.time.format("%I%p"),
            HH = 3,
            LY = this.size.y - HH;
        function updateLabel() {
            this.attr("transform", function(d, i) {
                var x = ~~xx(d) + .5,
                    y = LY;
                return "translate(" + [x, y] + ")";
            });
            this.select("line")
                .attr("y1", 0)
                .attr("y2", HH);
        }
        this.labels.selectAll("g.label").call(updateLabel);

        if (this.selectedTime) {
            this.updateSelectedTime();
        } else {
            this.selectTime(this.selectedTime);
        }
    },

    /**
     * Get a d3 transition generator for selections with a constant duration
     * and easing function. This is handy for not having to set those
     * parameters for multiple selections:
     * <code>
     * var trans = this.transitioner(100, "linear");
     * trans(d3.select("rect")).attr("x", dx);
     * trans(d3.select("line")).attr("y", dy);
     * </code>
     */
    transitioner: function(duration, ease) {
        return (!isNaN(duration) && duration > 0)
            ? function(selection) {
                return selection.transition()
                    .duration(duration)
                    .ease(ease || "cubic-in");
            }
            : function(selection) { return selection; };
    },

    // cached reference to latest checkpoint model object
    latest: null,
    /**
     * This is our timeline model update handler.
     * TODO: document
     */
    update: function(updates) {
        // don't update if this is a "fake" trigger
        if (!updates) return;

        var duration = 600,
            timeframe, start, last, end;
        // timeframe, start and end time
        if (updates && updates.timeframe) {
            timeframe = updates.timeframe;
            this.timeframe = this.timeline.getTimeframe(timeframe.id);
        } else if (this.timeframe) {
            timeframe = this.timeframe.toJSON();
        }
        var start = timeframe.start_time,
            last = timeframe.end_time - timeframe.period,
            end = last;

        var prevLastTime = this.latest
            ? this.latest.get("time")
            : null;

        if (this.latest) {
            this.latest.unbind("change:current_show_total", this.onLastChange, this);
            this.latest.stopBackfilling();
            this.latest = null;
        }

        // checkpoints, counts and totals
        var checks = this.checks = this.tracker.timeline.models.map(function(check) {
                return check.toJSON();
            }),
            counts = _.pluck(checks, "count"),
            totals = _.pluck(checks, "running_total");

        var rect = this.getChartRect(),
            W = rect.width,
            H = rect.height,
            L = rect.x,
            R = rect.x + W,
            T = rect.y,
            B = rect.y + H,
            B2 = B + this.padding[2],
            len = this.checks.length,
            // width of a single bar
            ww = Math.ceil(W / len);

        this.latest = this.tracker.timeline.last();
        this.latest.bind("change:current_show_total", this.onLastChange, this);
        this.latest.backfill(["show_total"], timeframe.period, this.tracker.timeline.models[len - 2]);

        // length of checkpoints list
        var len = checks.length,
            bw = this.barWidth,
            // width of a single bar
            ww = Math.ceil(W / len);
        // x scale
        var xx = this.xScale = d3.scale.linear()
            .domain([start, end])
            .range([L, R]);
        // y scale
        var hh = this.counts.yScale = d3.scale.linear()
            .domain([0, d3.max(counts)])
            .range([0, H]);

        // sets x according to time and y to the bottom
        function position() {
            this.attr("x", function(d, i) {
                return xx(d.time) - bw / 2;
            });
        }

        // sets x according to time and y to the bottom
        function resize() {
            this.attr("width", bw);
            this.attr("height", function(d, i) {
                return hh(d.count);
            });
            this.attr("y", function(d, i) {
                return B2 - hh(d.count);
            });
        }

        // our count bars
        var bars = this.counts.selectAll("rect")
            // bound to the checkpoints with time as their PK
            .data(checks, function(d, i) {
                return d.time;
            });

        var trans = this.transitioner(duration);

        // entering selection (new bars):
        var entering = bars.enter().append("svg:rect")
            .attr("class", "count")
            .attr("id", function(d, i) {
                return "t" + d.time;
            })
            .call(position)
            .attr("y", B2)
            .attr("width", bw)
            .attr("height", 0);
        trans(entering).call(resize)

        // existing selection: transition
        trans(bars)
            .call(position)
            .call(resize);

        // exiting selection (old bars): transition
        trans(bars.exit())
            .call(position)
            .call(resize)
            // then remove
            .remove();

        var dmax = d3.max(totals);
        var goal = timeframe.goal || 0;
        if (goal) {
            dmax = goal;
            this.bullseye.select(".goal")
                .text(this.formatTotal(goal));
            this.bullseye.attr("display", null);
        } else {
            this.chart.selectAll(".goal")
                .text("");
            this.bullseye.attr("display", "none");
        }

        // dy scale
        var dy = this.totals.yScale = d3.scale.linear()
            .domain([d3.min(totals), dmax])
            .range([B, T]);
        // console.log("dy domain:", dy.domain());

        // line generator with a constant x scale
        var lineScale = this.totals.lineScale = d3.svg.line()
            .x(function(d, i) {
                return xx(d.time);
            });

        this.points
            .attr("cx", function(d, i) {
                return xx((i == 0) ? start : end);
            });
        trans(this.points)
            .attr("r", 3)
            .attr("cy", function(d, i) {
                return dy.range()[i];
            });

        trans(this.cursor.select(".label circle"))
            .attr("r", 5)

        var line = this.totals;
        // if the line has no "d" attribute...
        if (!line.attr("d")) {
            lineScale.y(B); // zero out @ bottom of the graph
            line.attr("d", lineScale(checks));
        }

        // then transition up to the proper location
        lineScale
            .y(function(d, i) {
                return dy(d.running_total);
            });

        var points = this.totals.points = checks.slice();
        if (goal) {
            /*
            points.push({
                time: timeframe.end_time - timeframe.period,
                running_total: goal
            });
            */
        }
        trans(line)
            .attr("d", lineScale(points));

        var step = 3600,
            firstHour = Math.ceil(start / step) * step,
            lastHour = firstHour + (end - start),
            ticks = d3.range(firstHour, lastHour + 1, step);
        if (end - lastHour > step / 2) {
            ticks.push(end);
        }

        var HH = 3, LY = this.size.y - HH;

        function updateLabel() {
            this.attr("transform", function(d, i) {
                var x = ~~xx(d) + .5,
                    y = LY;
                return "translate(" + [x, y] + ")";
            });
            this.select("line")
                .attr("y1", 0)
                .attr("y2", HH);
            this.select("text")
                .attr("x", -1)
                .attr("y", -3)
                .text(function(d, i) {
                    var date = new Date(d * 1000);
                    return ((d % step == 0)
                        ? HOUR_FORMAT(date)
                        : TIME_FORMAT(date));
                });
        }

        var labels = this.labels.selectAll("g.label")
            .data(ticks, function(d, i) {
                return i;
            })
            .call(updateLabel);

        var newLabels = labels.enter().append("svg:g")
            .attr("class", "label")
            .attr("transform", function(d, i) {
                return "translate(" + [~~xx(d) + .5, LY + 20] + ")";
            });
        newLabels.append("svg:line")
            .attr("stroke", "#ccc")
        newLabels.append("svg:text")
            .attr("fill", "#ccc")
            .attr("font-size", 12)
            .attr("text-anchor", function(d, i) {
                return (d == end) ? "end" : "start";
            })
            .attr("alignment-baseline", "bottom")
        trans(newLabels)
            .call(updateLabel);

        labels.exit().remove();

        if (!this.selectedTime || this.selectedTime == prevLastTime) {
            this.selectTime(last, duration);
        } else {
            this.updateSelectedTime(duration);
        }
    }
});

/**
 * get the sum of an array of numbers.
 */
function sum(numbers) {
    return numbers.reduce(function(memo, n) {
        return memo + n;
    }, 0);
}

function formatTweet(tweet) {
    var div = d3.select(document.createElement("div"))
        .attr("class", "tweet");

    var id = tweet.href.split("/").pop();
    if (id !== String(tweet.id)) {
        console.warn("tweet ID mismatch:", [id, "vs.", tweet.id]);
    }

    if (tweet.icon) {
        div.append("a")
            .attr("class", "icon")
            .attr("href", "http://twitter.com/" + tweet.user)
            .append("img")
                .attr("src", tweet.icon);
        div.classed("has-icon", true);
    }
    var name = div.append("p")
        .attr("class", "author");
    name.append("a")
        .attr("class", "name")
        .attr("href", "http://twitter.com/intent/user?screen_name=" + tweet.user)
        .text(tweet.user);

    /*
    name.append("a")
        .attr("class", "twitter-follow-button")
        .attr("href", "http://twitter.com/" + tweet.user)
        .attr("data-button", "grey")
        .text("follow");
    */

    div.append("p")
        .attr("class", "text")
        .html(linkify(tweet.text))


    var links = div.append("div")
        .attr("class", "links");

    var icn = '<span class="icon"></span> ';
    links.append("a")
        .attr("class", "perm")
        .attr("href", tweet.href)
        .html(icn + TIME_FORMAT(new Date(tweet.time * 1000)));

    links.append("a")
        .attr("class", "reply")
        .attr("href", "http://twitter.com/intent/tweet?in_reply_to=" + id)
        .html(icn + "Reply");

    links.append("a")
        .attr("class", "retweet")
        .attr("href","http://twitter.com/intent/retweet?tweet_id=" + id)
        .html(icn + "Retweet");

    links.append("a")
        .attr("class", "fave")
        .attr("href","http://twitter.com/intent/favorite?tweet_id=" + id)
        .html(icn + "Favorite");

    div.selectAll("a")
        .attr("target", "_blank");

    return div.node();
}

function linkify(text) {
    var chop = linkify.chop;
    // sanitize HTML
    text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // replace links
    text = text.replace(/(https?:\/\/[^\s]+|t\.co\/[^\s]+)/g, function(url) {
        var last = url.substr(-1);
        if (chop.indexOf(last) > -1) {
            var first = url.substr(0, url.length - 1);
            return '<a target="_blank" href="' + first + '">' + first + '</a>' + last;
        }
        return '<a target="_blank" href="' + url + '">' + url + '</a>';
    });
    // replace hashtags
    text = text.replace(/(#\w+)/g, function(hashtag) {
        return '<a target="_blank" href="http://search.twitter.com/search?q=' + escape(hashtag) + '">' + hashtag + '</a>';
    });
    // replace @s
    text = text.replace(/(@\w+)/g, function(username) {
        return '<a href="http://twitter.com/intent/user?screen_name=' + escape(username.substr(1)) + '">' + username + '</a>';
    });
    return text;
}
linkify.chop = ['.', '!', '?', ')'];

/**
 * convert a Twitter API response object to a simpler Eddy-like tweet object.
 */
function twitter2eddy(t) {
    var time = Date.parse(t.created_at),
        user = t.user.screen_name,
        id = t.id,
        href = ["http://twitter.com", user, "status", id].join("/");
    return {
        id:     id,
        text:   t.text,
        user:   user,
        icon:   t.user.profile_image_url,
        time:   time,
        href:   href
    };
}

})();



