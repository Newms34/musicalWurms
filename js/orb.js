//pointers are pointing in the wrong direction. is this an error with the accel calcs or an error with the pointer calcs?

var app = angular.module('gravSim', []).controller('gravCont', function($scope) {
    $scope.parts = [];
    $scope.numParts = 10;
    $scope.bigG = 5;
    $scope.field = {
        x: $(window).width(),
        y: $(window).height()
    }
    $scope.elapsed = 0;
    $scope.canv = document.querySelector('#canv');
    $scope.ctx = $scope.canv.getContext('2d');
    $scope.canv.width = $scope.field.x;
    $scope.canv.height = $scope.field.y;
    $scope.canv.style.width = $scope.field.x + 'px';
    $scope.canv.style.height = $scope.field.y + 'px';

    $scope.partConst = function() {
        this.x = Math.floor(Math.random() * $scope.field.x);
        this.y = Math.floor(Math.random() * $scope.field.y);
        this.mass = Math.floor(Math.random() * 10) + 2;
        this.temp = {
            h: 60,
            v: 50
        };
        this.a = { x: 0, y: 0 }
        this.vx = 0;
        this.vy = 0;
        this.data = '';
    }
    $scope.pointerAng = function(p) {
        var ang = Math.atan(p.a.y / p.a.x) * 180 / Math.PI;
        if (p.a.x > 0) {
            ang += 180;
        }
        return ang;
    };
    $scope.initP = function() {
        $scope.parts = []; //empty partz
        for (var i = 0; i < $scope.numParts; i++) {
            $scope.parts.push(new $scope.partConst());
        }
        $scope.elapsed = 0;
        $scope.ctx.fillStyle = '#000';
        $scope.ctx.fillRect(0, 0, $scope.canv.width, $scope.canv.height)
    }
    $scope.initP();
    $scope.timer = setInterval(function() {
        if (!$scope.trailMode) {
            $scope.ctx.fillStyle = '#000';
            $scope.ctx.fillRect(0, 0, $scope.canv.width, $scope.canv.height)
        }
        for (var i = 0; i < $scope.parts.length; i++) {
            if ($scope.trailMode) {
                //draw trails on canv;
                $scope.ctx.fillStyle = 'rgba(0,0,0,.1)'
                $scope.ctx.fillRect(($scope.parts[i].x + ($scope.parts[i].mass / 3)), ($scope.parts[i].y + ($scope.parts[i].mass / 3)), ($scope.parts[i].mass / 3), ($scope.parts[i].mass / 3))
                $scope.ctx.fillStyle = 'hsla(' + 360 * (i / $scope.numParts) + ',100%,' + Math.floor($scope.parts[i].temp.v + 20) + '%,.1)'
                $scope.ctx.fillRect(($scope.parts[i].x + ($scope.parts[i].mass / 2)), ($scope.parts[i].y + ($scope.parts[i].mass / 2)), ($scope.parts[i].mass / 2), ($scope.parts[i].mass / 2))
            }
            //new acceleration vals
            $scope.parts[i].a = { x: 0, y: 0 };
            var minDist = 0,
            dist = 0;
            for (var j = 0; j < $scope.parts.length; j++) {
                if (j == i) {
                    continue;
                }
                minDist = $scope.parts[i].mass + $scope.parts[j].mass;
                dist = Math.sqrt(Math.pow(Math.abs($scope.parts[i].x - $scope.parts[j].x), 2) + Math.pow(Math.abs($scope.parts[i].y - $scope.parts[j].y), 2));
                if (dist <= minDist) {
                    //distance too small (objects are 'touching'), which would lead to infinite distances
                    continue;
                }
                //tan is op/adj is dy/dx
                var rawA = ($scope.bigG * $scope.parts[j].mass) / Math.pow(dist, 2),
                    tan = (($scope.parts[j].y - $scope.parts[i].y) / ($scope.parts[j].x - $scope.parts[i].x)); //tangent in radians
                $scope.parts[i].a.x += rawA * Math.sin(Math.atan(tan));
                $scope.parts[i].a.y += rawA * Math.cos(Math.atan(tan));
            }
            //mouse!
            dist = Math.sqrt(Math.pow(Math.abs($scope.parts[i].x - $scope.m.x), 2) + Math.pow(Math.abs($scope.parts[i].y - $scope.m.y), 2));
            if (dist <= minDist) {
                //distance too small (objects are 'touching'), which would lead to infinite distances
                continue;
            }
            var rawA = ($scope.bigG * $scope.m.m) / Math.pow(dist, 2),
                tan = (($scope.parts[i].y - $scope.m.y) / ($scope.parts[i].x - $scope.m.x)); //tangent in radians
            $scope.parts[i].a.x += rawA * Math.sin(Math.atan(tan));
            $scope.parts[i].a.y += rawA * Math.cos(Math.atan(tan));

            //end mouse
            //adjust v as per a.
            $scope.parts[i].vx += $scope.parts[i].a.x;
            $scope.parts[i].vy += $scope.parts[i].a.y;
            //adjust hue.
            $scope.parts[i].temp.h = 60 * Math.min(Math.abs($scope.parts[i].vx), 4) / 4;
            $scope.parts[i].temp.v = (80 * Math.min(Math.abs($scope.parts[i].vx), 4) / 4) + 10;
            $scope.parts[i].data = { vx: $scope.parts[i].vx, vy: $scope.parts[i].vy, ax: $scope.parts[i].a.x, ay: $scope.parts[i].a.y, h: $scope.parts[i].temp.h };
            //boundaries
            //x
            if (($scope.parts[i].x <= 0 && $scope.parts[i].vx < 0) || ($scope.parts[i].x >= $scope.field.x && $scope.parts[i].vx > 0)) {
                $scope.parts[i].vx *= -1;
            }
            //y
            if (($scope.parts[i].y <= 0 && $scope.parts[i].vy < 0) || ($scope.parts[i].y >= $scope.field.y && $scope.parts[i].vy > 0)) {
                $scope.parts[i].vy *= -1;
            }
            //finally, move parts
            $scope.parts[i].x += $scope.parts[i].vx;
            $scope.parts[i].y += $scope.parts[i].vy;
            //error detection!
            if (isNaN($scope.parts[i].vx) || $scope.parts[i].vx >= Number.POSITIVE_INFINITY) {
                throw new Error('vx error!')
            }
            if (isNaN($scope.parts[i].vy) || $scope.parts[i].vy >= Number.POSITIVE_INFINITY) {
                throw new Error('vy error!')
            }
            if (isNaN($scope.parts[i].a.x) || $scope.parts[i].a.x >= Number.POSITIVE_INFINITY) {
                throw new Error('ax error!')
            }
            if (isNaN($scope.parts[i].a.y) || $scope.parts[i].a.y >= Number.POSITIVE_INFINITY) {
                throw new Error('ay error!')
            }
            // console.log('I:',i,'VX',$scope.parts[i].vx,"VY", $scope.parts[i].vy)
        }
        $scope.$digest();
    }, 50)
    $scope.stopTimer = function() {
        clearInterval($scope.timer)
    };
    $scope.m = {
        x: 0,
        y: 0,
        m: 50
    }
    window.onmousemove = function(e) {
        $scope.m.x = e.x || e.clientX;
        $scope.m.y = e.y || e.clientY;
    }
})
