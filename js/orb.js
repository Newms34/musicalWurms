var canv = document.querySelector('#myCanv'),
    ctx = canv.getContext("2d"),
    orgCon = function(a) {
        this.x = Math.floor(Math.random() * ($(window).width() - 3));
        this.y = Math.floor(Math.random() * ($(window).height() - 3));
        this.vx = (Math.random() * 4) - 2;
        this.vy = (Math.random() * 4) - 2;
        this.mass = Math.floor(Math.random() * 12) + 1;
        this.targ={x:0,y:0};
    };
//setup canvas;
canv.width = $(window).width();
canv.height = $(window).height();
canv.style.width = canv.width + 'px';
canv.style.height = canv.height + 'px';

//for some reason, vx,vy do not seem to be decreasing!

var app = angular.module('orbApp', []).controller('orbCon', function($scope) {
    $scope.parts = [];
    $scope.maxDist = 70;
    $scope.glo = true;
    $scope.numParts = 6;
    $scope.trailMode = false;
    $scope.bigG = .1;
    $scope.customHue = 0;
    $scope.customHueMode = false;
    $scope.showVecs=true;
    $scope.mousePos = {x:0,y:0};
    //monitors
    $scope.cw = canv.width;
    $scope.ch = canv.height;
    //end monitors

    $scope.initParts = function() {
        $scope.parts = [];
        for (var i = 0; i < $scope.numParts; i++) {
            $scope.parts.push(new orgCon())
        }
    };
    $scope.toggleOpts = function() {
        $('#swarmOpts').toggle(100);
    }
    $scope.initParts();
    $scope.rescatter = function() {
        $scope.parts.forEach((p) => {
            p.x = Math.floor(Math.random() * (canv.width - 2));
            p.y = Math.floor(Math.random() * (canv.height - 2));
        })
    }
    ctx.strokeStyle = '#fff';
    ctx.fillRect(0, 0, canv.width, canv.height);
    $scope.timer = setInterval(function() {
        //first, clear canvas
        ctx.fillStyle = '#000';
        if (!$scope.trailMode) ctx.fillRect(0, 0, canv.width, canv.height); //if trail mode is off, we clear canvas each time.
        $scope.parts.forEach(function(p, n) {
            var closestDist = Math.sqrt(Math.pow(canv.width, 2) + Math.pow(canv.height, 2)),
                prevPos = {
                    x: p.x,
                    y: p.y
                };
            var prevVal = { x: p.targ.x, y: p.targ.y }
            p.targ.x = 0;
            p.targ.y = 0;

            // re-enable below for pp grav
            for (var i = 0; i < $scope.parts.length; i++) {
                if (i !== n) {
                    var xMult = parseInt(p.x > $scope.parts[i].x ? -1 : 1);
                    var yMult = parseInt(p.y > $scope.parts[i].y ? -1 : 1);
                    if (p.x != $scope.parts[i].x && Math.abs(p.x-$scope.parts[i].x)>p.mass) {
                        p.targ.x += xMult * ($scope.bigG * p.mass * $scope.parts[i].mass) / Math.pow(Math.abs(p.x - $scope.parts[i].x), 2);
                    }
                    if (p.y != $scope.parts[i].y && Math.abs(p.y-$scope.parts[i].y)>p.mass) {
                        p.targ.y += yMult * ($scope.bigG * p.mass * $scope.parts[i].mass) / Math.pow(Math.abs(p.y - $scope.parts[i].y), 2);
                    }
                }
                if (p.targ.x == Number.POSITIVE_INFINITY || p.targ.y == Number.POSITIVE_INFINITY) {
                    alert('calc error: targ' + JSON.stringify(p.targ) + '\np.x: ' + JSON.stringify(p.x) + '\np.y: ' + JSON.stringify(p.y) +
                        '\ncomparison targ: ' + JSON.stringify($scope.parts[i]) + '\nprev val: ' + JSON.stringify(prevVal))
                }
            }
            //and mouse: 
            if(p.x > $scope.mousePos.x && p.x!==$scope.mousePos.x && Math.abs(p.x-$scope.mousePos.x)>p.mass){
                p.targ.x -= $scope.bigG * p.mass * 50 / Math.pow(Math.abs(p.x - $scope.mousePos.x), 2);
            }else if(p.x!==$scope.mousePos.x && Math.abs(p.x-$scope.mousePos.x)>p.mass){
                p.targ.x += $scope.bigG * p.mass * 50 / Math.pow(Math.abs(p.x - $scope.mousePos.x), 2);
            }
            if(p.y > $scope.mousePos.y && p.y!==$scope.mousePos.y && Math.abs(p.y-$scope.mousePos.y)>p.mass){
                p.targ.y -= $scope.bigG * p.mass * 50 / Math.pow(Math.abs(p.y - $scope.mousePos.y), 2);
            }else if(p.y!==$scope.mousePos.y && Math.abs(p.y-$scope.mousePos.y)>p.mass){
                p.targ.y += $scope.bigG * p.mass * 50 / Math.pow(Math.abs(p.y - $scope.mousePos.y), 2);
            }
            // p.targ.x+=parseInt(p.x > $scope.mousePos.x ? -1 : 1)* $scope.bigG * p.mass * 50 / Math.pow(Math.abs(p.x - $scope.mousePos.x), 2)
            // p.targ.y+=parseInt(p.y > $scope.mousePos.y ? -1 : 1)* $scope.bigG * p.mass * 50 / Math.pow(Math.abs(p.y - $scope.mousePos.y), 2)
            //now, position changes
            p.vx = (p.targ.x / p.mass)/.05;
            p.vy = (p.targ.y / p.mass)/.05;
            var maxRad = Math.sqrt(Math.pow(canv.width,2)+Math.pow(canv.height,2)),
                hue = 60*Math.sqrt(Math.pow(Math.abs(p.vx),2)+Math.pow(Math.abs(p.vy),2))/maxRad;
                val = 10+(50*Math.sqrt(Math.pow(Math.abs(p.vx),2)+Math.pow(Math.abs(p.vy),2))/maxRad);

            // console.log(n, hue, maxRad,'TARG:', p.targ, p.vx, p.vy)
            console.log(p.vx,p.vy)

            //finally, bounds stuff
            if ((p.vx > 0 && p.x < (canv.width - 2)) || (p.vx < 0 && p.x > 0)) {
                //within bounds
                p.x += p.vx;
            } else {
                p.vx *= -1;
                p.x += p.vx;
            }

            if ((p.vy > 0 && p.y < (canv.height - 2)) || (p.vy < 0 && p.y > 0)) {
                //within bounds
                p.y += p.vy;
            } else {
                p.vy *= -1;
                p.y += p.vy;
            }
            //done position changes!
            ctx.fillStyle = 'hsl(' + ($scope.customHueMode ? $scope.customHue : hue) + ',100%,' + val + '%)';
            ctx.fillRect(p.x, p.y, p.mass, p.mass);
            if ($scope.glo) {
                ctx.fillStyle = 'hsla(' + ($scope.customHueMode ? $scope.customHue : hue) + ',100%,' + val + '%,.1)';
                ctx.fillRect(prevPos.x - (p.mass / 2), prevPos.y - (p.mass / 2), (p.mass * 2), (p.mass * 2));
            }
            if ($scope.showVecs){
                //tangent = o/a  = p.vy/p.vx;
                //h=1 (unit vector!)
                //sin(arctan(tan)) = o/h, o = hsin(arctan(tan));
                //cos(arctan(tan)) = a/h, a = hsin(arctan(tan)); 
                var theLine = {
                    x:  10*Math.cos(Math.atan(p.vy/p.vx)),
                    y: 10*Math.sin(Math.atan(p.vy/p.vx))
                }
                ctx.beginPath();
                ctx.moveTo(p.x,p.y);
                ctx.lineTo(p.x-theLine.x,p.y-theLine.y);
                ctx.stroke();
            }
            $scope.$digest();
        })
    }, 50);
    canv.onmousemove=function(e){
        $scope.mousePos.x = e.offsetX;
        $scope.mousePos.y = e.offsetY;
        console.log($scope.mousePos);
    }
})
