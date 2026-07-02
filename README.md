# 3D Voxel Volume Renderer

## Overview
This application is a web-based 3D visualization tool designed to display volumetric medical data, such as CT or MRI scans, directly in your web browser.  

## File Format Requirements (.dat / .raw)
To view a scan, your uploaded file must be a binary file structured as follows:  

* **Header (First 6 Bytes):** Defines the 3D grid dimensions using three 16-bit unsigned integers (Uint16):
  * **Bytes 0–1:** Width (horizontal resolution).  
  * **Bytes 2–3:** Height (vertical resolution).  
  * **Bytes 4–5:** Depth (number of slices).  
* **Scan Data (Remaining Bytes):** A continuous sequence of 16-bit unsigned integers (Uint16) representing voxel density/intensity, ranging from 0 to 4095.  

## Visualization Modes
You can toggle between two rendering styles using the dropdown menu:  

* **MIP Mode (Maximum Intensity Projection):** Highlights the densest structures (like bone or contrast-enhanced vessels) by displaying the highest density value along your line of sight  
* **ISO Mode (Isosurface Rendering):** Reconstructs distinct surfaces and tissue boundaries (like isolating organs or skin) with realistic 3D lighting, shadows, and reflections.  

## How to Use the Interface
* **Density Histogram:** Shows the distribution of different tissue densities across the loaded scan.  
* **Color & Transparency Adjustments:** Click the `+` button to add up to 5 control nodes onto the histogram. Drag these nodes to dynamically change the color and opacity of specific density ranges in real-time (e.g., making soft tissue transparent while keeping bone visible).  

## Running the Application
This project must be served through a local web server to load the necessary graphics files.  

1. Start a local web server (e.g., VS Code Live Server, Python `http.server`, or Node `http-server`) in the project folder.
2. Open `index.html` via your web browser.  
3. Upload your 3D volume file using the file input button.  
4. Select either **MIP** or **ISO** mode from the menu.  
5. Use the `+` button and the color picker to isolate and highlight different anatomical structures.