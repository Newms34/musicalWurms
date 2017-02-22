var canv = document.querySelector('#myCanv'),
    ctx = canv.getContext("2d"),
    orgCon = function(a) {
        this.x = Math.floor(Math.random() * ($(window).width() - 3));
        this.y = Math.floor(Math.random() * ($(window).height() - 3));
        this.vx = (Math.random() * 4) - 2;
        this.vy = (Math.random() * 4) - 2;
        if (AudioContext && a) {
            //audio supported!
            this.aud = new AudioContext();
            this.vol = this.aud.createGain();
            this.vol.gain.value = .1;
            this.osc = this.aud.createOscillator();
            this.osc.type = 'square';
            this.osc.connect(this.vol);
            this.vol.connect(this.aud.destination);
            this.osc.start();
        }
    };
//setup canvas;
canv.width = $(window).width();
canv.height = $(window).height();
canv.style.width = canv.width + 'px';
canv.style.height = canv.height + 'px';

var app = angular.module('swarmApp', []).controller('swarmCon', function($scope) {
    $scope.parts = [];
    $scope.minDist = 20;
    $scope.maxDist = 70;
    $scope.partSize = 1;
    $scope.glo = true;
    $scope.numParts = 180;
    $scope.trailMode = true;
    $scope.vol = 1;
    $scope.customHue = 0;
    $scope.customHueMode = false;
    $scope.initParts = function() {
        if ($scope.parts.length) {
            $scope.parts.forEach((x) => {
                if (x.aud) {

                    x.aud.close();
                }
            });
        }
        $scope.parts = [];
        for (var i = 0; i < $scope.numParts; i++) {
            $scope.parts.push(new orgCon(i < 5))
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
    $scope.flocking = true;
    ctx.fillRect(0, 0, canv.width, canv.height);
    $scope.alterWaves = function() {
        for (var i = 0; i < $scope.parts.length; i++) {
            if ($scope.parts[i].osc) {
                $scope.parts[i].osc.type = $scope.waveType;
            }
        }
    };
    $scope.timer = setInterval(function() {
        //first, clear canvas
        ctx.fillStyle = '#000';
        if (!$scope.trailMode) ctx.fillRect(0, 0, canv.width, canv.height);
        $scope.parts.forEach(function(p, n) {
            var closestDist = Math.sqrt(Math.pow(canv.width, 2) + Math.pow(canv.height, 2)),
                prevPos = {
                    x: p.x,
                    y: p.y
                };
            for (var i = 0; i < $scope.parts.length; i++) {
                var thisDist = Math.sqrt(Math.pow(Math.abs(p.x - $scope.parts[i].x), 2) + Math.pow(Math.abs(p.y - $scope.parts[i].y), 2));
                if (i !== n && thisDist < closestDist) {
                    closestDist = thisDist;
                }
            }

            var hue = 240 * closestDist / 100;
            if (hue > 240) hue = 240;
            var val = closestDist < ($scope.maxDist * .6) ? 75 * (($scope.maxDist * .6) - closestDist) / ($scope.maxDist * .6) : 5;
            //now, position changes
            //first, random changes & flocking
            if (Math.random() > .97 || ($scope.flocking && (closestDist > $scope.maxDist || closestDist < $scope.minDist && !p.dirChangeTimer))) {
                p.dirChangeTimer = 60;
                p.vx = (Math.random() * 4) - 2;
            }
            if (Math.random() > .97 || ($scope.flocking && (closestDist > $scope.maxDist || closestDist < $scope.minDist && !p.dirChangeTimer))) {
                p.dirChangeTimer = 20;
                p.vy = (Math.random() * 4) - 2;
            }
            if (p.dirChangeTimer) p.dirChangeTimer--;

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
            ctx.fillRect(p.x, p.y, $scope.partSize, $scope.partSize);
            if ($scope.glo) {
                ctx.fillStyle = 'hsla(' + ($scope.customHueMode ? $scope.customHue : hue) + ',100%,' + val + '%,.1)';
                ctx.fillRect(prevPos.x - ($scope.partSize / 2), prevPos.y - ($scope.partSize / 2), ($scope.partSize * 2), ($scope.partSize * 2));
            }
            if (p.osc && $scope.switchAudio) {
                //haz audio!
                p.vol.gain.value = ($scope.vol / 150) * (canv.height - p.y) / canv.height;
                p.osc.frequency.value = 440 * (Math.pow(2, (((88 * (p.x / canv.width)) - 49) / 12)));
            } else if (p.osc) {
                p.vol.gain.value = ($scope.vol / 150) * (p.x / canv.width);
                p.osc.frequency.value = 440 * (Math.pow(2, (((88 * (canv.height - p.y) / canv.height) - 49) / 12)));
            }
        })
    }, 50)
})
