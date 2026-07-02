import * as THREE from 'three';
import * as d3 from 'd3';
export class Histogram {
    constructor(_config, _data){
        this.config= {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 600,
            containerHeight: _config.containerHeight || 400,
            margin: _config.margin || {top: 40, right: 20, bottom: 20, left: 35},
        }
        
        this.data = _data;//float32array
        this.binGenerator = d3.bin()
            .domain([0, 1])     
            .thresholds(d3.range(0, 1.001 , 0.01));

        this.color = new THREE.Color(1.0, 0.0, 0.0);
        this.balls = [];
        
        this.initVis();
        

    }

    initVis(){
        let vis = this;
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = (vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom)/2;


        vis.xScale = d3.scaleLinear()
            .range([0,vis.width]);
            

        vis.yScale = d3.scaleLog()
            .range([0, vis.height]);

    
        vis.yScaleTop = d3.scaleLinear() //iso select
            .range([vis.height , 0])
            .domain([0,1]);


        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(10);
            
        vis.yAxis = d3.axisLeft(vis.yScale) //not used
            .ticks(10);
        
        vis.yAxisTop = d3.axisLeft(vis.yScaleTop) //iso select
            .ticks(10);
        
        

        
        vis.svg = d3.select(vis.config.parentElement)
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);

       
        vis.chart = vis.svg.append("g")
            .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top})`);
        
        
        vis.barsG = vis.chart.append("g").attr("class", "bar-g"); // z-indexign

        
        vis.xAxisG = vis.chart.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${vis.height})`);
    
        vis.yAxisG = vis.chart.append("g")
            .attr("class", "axis y-axis");
            

        vis.chart.append("text")
            .attr("class", "axis-title")
            .attr("y", vis.height - 15)
            .attr("x", vis.width + 10)
            .attr("dy", ".42em")
            .style("text-anchor", "end")
            .text("density");

        vis.chart.append("text")
            .attr("class", "axis-title")
            .attr("x", -5)
            .attr("y", -11)
            .attr("dy", ".42em")
            .text("intensity");

        
        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxisTop);

        
        
        //colorPicker

        let ballID = 0;
        let activeBallElement;
        let activeBall;


        vis.dragBehavior = d3.drag()
            .on("start", function() {
                d3.selectAll(".col-ball").attr("stroke", "none");

                activeBallElement = d3.select(this).
                attr("r", 10).
                attr("stroke", "white").
                attr("stroke-width", "3");

                activeBall = vis.balls.find(item => item.id === Number(activeBallElement.attr("id")));

            })
            .on("drag", function(event) {
                let mouseX = Math.max(0, Math.min(vis.width, event.x));
                let mouseY = Math.max(0, Math.min(vis.height, event.y));
                
                d3.select(this).
                attr("cx", mouseX).
                attr("cy", mouseY);

                activeBall.iso = vis.xScale.invert(mouseX);
                activeBall.transparency = vis.yScaleTop.invert(mouseY)


            })
            .on("end", function(event) {
                d3.select(this).
                attr("r", 7);
                
            });

        vis.selectionBalls = vis.chart.append("g").attr("class", "col-balls");
   
        d3.select("#addBall").on("click", () => { 

            if(d3.select("#renderMode").property("value")==="MIP" && vis.balls.length >= 1) return;
            if (vis.balls.length >= 5) return;

            d3.selectAll(".col-ball").attr("stroke", "none");
            
            activeBallElement = vis.selectionBalls.append("circle").
                attr("class", `col-ball`).
                attr("id", `${ballID}`).
                attr("r", 7).     
                attr("fill", "#ffffff").
                attr("stroke", "white").
                attr("stroke-width", "3").
                style("cursor", "pointer").
                call(vis.dragBehavior);
            
                const newBall = {
                id: ballID++,
                iso: 0.0,
                transparency: 1.0,
                color: new THREE.Color("#ffffff")
            };

            activeBall = newBall;
            vis.balls.push(newBall);
            
        });


        d3.select("#removeBall").on("click", () => {
            if (vis.balls.length == 1) return;

            if (activeBallElement) { 
                activeBallElement.remove();
                
                vis.balls = vis.balls.filter(item => item.id !== Number(activeBallElement.attr("id")));

                activeBallElement = null; 
                activeBall = null;
            }
        });

        
        //colorPicker
      

        vis.colors = ["#ffffff", "#ff0000", "#001eff", "#00ff4c", "#ff8102",
             "#e1ff00", "#168ccb", "#4b00fa", "#f60097", "#b91b1b"];   
        
        vis.colorPicker = vis.chart.append("g")
            .attr("transform", `translate(${vis.width - ((vis.colors.length - 1)*25)-10},${-vis.config.margin.top/2})`);

        vis.colorPicker.selectAll("circle").
            data(vis.colors).
            enter().
        append("circle").
            attr("class", "colorVal").
            attr("cx", (d, i) => i * 25).
            attr("cy", 0).               
            attr("r", 10).
            attr("fill", d => d).
            style("cursor", "pointer").
            on("click", function(event,d){
                if (activeBallElement && activeBall) { 
                    activeBallElement.attr("fill", d);
                    activeBall.color = new THREE.Color(d);
                }


            })

           

        
                
        d3.select("#addBall").dispatch("click");
        
        
        


    }

    updateVis(){
        let vis = this;
    
        vis.bins= vis.binGenerator(vis.data);


        vis.xValue = d => d.x0;
        vis.yValue = d => d.length === 0 ? 1 : d.length; //log0



        vis.xScale.domain([0, 1]);
        vis.yScale.domain([1, d3.max(vis.bins, vis.yValue)]);

        

        vis.renderVis();

    }
    
    renderVis(){

        let vis = this;


        const t = vis.barsG.transition()
        .duration(1000);
        
        let bars = vis.barsG.selectAll(".bin")
            .data(vis.bins)
            .join(
                enter => enter.append("rect")
                    .attr("class", "bin")
                    .attr("fill", "red")
                    .attr("stroke", "black")
                    .attr("stroke-width", "1px")
                    .attr("x", d => vis.xScale(vis.xValue(d)))
                    .attr("y", vis.height)
                    .attr("width", vis.width/100)
                    .attr("height", 0)
                .call(enter => enter.transition(t)
                    .attr("height", d => vis.yScale(vis.yValue(d)))),
                update => update
                    .attr("class", "bin")
                    .attr("fill", "red")
                    .attr("stroke", "black")
                    .attr("stroke-width", "1px")
                    .attr("x", d => vis.xScale(vis.xValue(d)))
                    .attr("y", vis.height)
                    .attr("width", vis.width/100)
                .call(update => update.transition(t)
                    .attr("height", d => vis.yScale(vis.yValue(d))))
            )
               
            
            

            
    

        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxisTop);
    }

    getBalls(){
        return this.balls;
    }

    clearBalls() {
        let vis = this;
        
        
        if (vis.selectionBalls) {
            vis.selectionBalls.selectAll(".col-ball").remove();
        }


        vis.balls = [];

        d3.select("#addBall").dispatch("click");
    }

    


}

