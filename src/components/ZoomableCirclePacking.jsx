"use client";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { sampleData } from "../data/sampleData";

const ZoomableCirclePacking = () => {
  const svgRef = useRef(null);
  const [details, setDetails] = useState("");

  useEffect(() => {
    // Chart dimensions
    const width = 928;
    const height = width;

    // Create color scale
    const color = d3
      .scaleLinear()
      .domain([0, 5])
      .range(["#003366", "#00CCCC"])
      .interpolate(d3.interpolateHcl);

    // Compute the layout
    const pack = (data) =>
      d3.pack().size([width, height]).padding(3)(
        d3
          .hierarchy(data)
          .sum((d) => (d.children ? 0 : 1))
          .sort((a, b) => b.value - a.value)
      );
    const root = pack(sampleData);

    // Create SVG container
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
      .attr("width", width)
      .attr("height", height)
      .attr(
        "style",
        `max-width: 100%; height: auto; display: block; margin: 0 auto; background: ${color(
          0
        )}; cursor: pointer;`
      );

    // Append the nodes
    const getRandomColor = () => {
      const r = Math.floor(Math.random() * 156 + 100); // Random value between 100 and 255
      const g = Math.floor(Math.random() * 156 + 100); // Random value between 100 and 255
      const b = Math.floor(Math.random() * 156 + 100); // Random value between 100 and 255
      return `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    };
    const node = svg
      .append("g")
      .selectAll("circle")
      .data(root.descendants().slice(1))
      .join("circle")
      .attr("fill", (d) => (d.children ? color(d.depth) : getRandomColor()))
      .attr("pointer-events", (d) => (!d.children ? "none" : null))
      .on("mouseover", function () {
        d3.select(this).attr("stroke", "#FFD700");
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", null);
      })
      .on("click", (event, d) => {
        setDetails(formatDetails(d));
        focus !== d && (zoom(event, d), event.stopPropagation());
      });

    // Append the text labels
    const label = svg
      .append("g")
      .style("font", "32px sans-serif")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants())
      .join("text")
      .style("fill-opacity", (d) => (d.parent === root ? 1 : 0))
      .style("display", (d) => (d.parent === root ? "inline" : "none"))
      .text((d) => d.data.name);

    // Zoom functionality
    svg.on("click", (event) => zoom(event, root));
    let focus = root;
    let view;
    zoomTo([focus.x, focus.y, focus.r * 2]);

    function zoomTo(v) {
      const k = width / v[2];
      view = v;
      label.attr(
        "transform",
        (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
      );
      node.attr(
        "transform",
        (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
      );
      node.attr("r", (d) => d.r * k);
    }

    function zoom(event, d) {
      const focus0 = focus;
      focus = d;
      const transition = svg
        .transition()
        .duration(event.altKey ? 7500 : 750)
        .tween("zoom", (d) => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
          return (t) => zoomTo(i(t));
        });

      label
        .filter(function (d) {
          return d.parent === focus || this.style.display === "inline";
        })
        .transition(transition)
        .style("fill-opacity", (d) => (d.parent === focus ? 1 : 0))
        .on("start", function (d) {
          if (d.parent === focus) this.style.display = "inline";
        })
        .on("end", function (d) {
          if (d.parent !== focus) this.style.display = "none";
        });
    }

    function formatDetails(node) {
      if (node === root) {
        // Summary information when nothing is clicked
        const totalResearchAreas = root.children.length;
        const totalVendors = root.leaves().length;
        return `
          <div class="summary-details">
            <h2 class="text-5xl font-bold text-purple-700 mb-8 ">Vendors Details</h2>
            <p class="mb-6 text-3xl"><strong>Total Research Areas:</strong> ${totalResearchAreas}</p>
            <p class="mb-6 text-3xl"><strong>Total Vendors:</strong> ${totalVendors}</p>
          </div>
        `;
      } else if (node.depth === 1 || node.depth === 2) {
        // Research area details
        const subResearchAreas = node.children.length;
        const vendorList = node
          .leaves()
          .map((leaf) => leaf.data.name)
          .join(", ");
        return `
          <div class="research-area-details">
            <h2  class="text-5xl font-bold text-purple-700 mb-8 ">${node.data.name}</h2>
            <p  class="mb-6 text-3xl"><strong>Sub-research Areas:</strong> ${subResearchAreas}</p>
            <p  class="mb-6 text-3xl"><strong>Vendors:</strong> ${vendorList}</p>
          </div>
        `;
      } else if (node.data.companyName) {
        // Vendor details (unchanged from previous version)
        return `
          <div class="vendor-details">
            <h2  class="text-5xl font-bold text-purple-700 mb-8 ">${
              node.data.companyName
            }</h2>
            <p  class="mb-6 text-3xl"><strong>Contact:</strong> ${
              node.data.contactPerson
            }</p>
            <p class="mb-6 text-3xl"><strong>Website:</strong> <a href="https://${
              node.data.website
            }" target="_blank" rel="noopener noreferrer">${
          node.data.website
        }</a></p>
            <p class="mb-6 text-3xl"><strong>Location:</strong> ${
              node.data.location
            }</p>
            <p class="mb-6 text-3xl"><strong>About:</strong> ${
              node.data.about
            }</p>
            <h3 class="text-lg font-semibold mt-4 mb-2">Products:</h3>
            <ul class="list-disc pl-5">
              ${
                node.data.products
                  ? node.data.products
                      .map((product) => `<li>${product}</li>`)
                      .join("")
                  : "No products listed"
              }
            </ul>
          </div>
        `;
      }
      return `<div><strong>${node.data.name}</strong></div>`;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setDetails(formatDetails(root));
        zoom(event, root);
      }
    }

    // Add event listener for ESC key
    window.addEventListener("keydown", handleKeyDown);

    // Set initial details to summary information
    setDetails(formatDetails(root));

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      {/* <header className="text-center p-2 bg-blue-900 text-white flex-shrink-0">
        <h1>WESEE Indian Naval</h1>
      </header> */}
      <div className="flex flex-row h-screen">
        <div className="flex flex-grow justify-center bg-gray-100 overflow-hidden">
          <svg ref={svgRef} className="h-4/5 max-h-full"></svg>
          <div className="ml-5 p-4 bg-white border border-blue-900 bg- w-1/3 h-4/5 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-purple-600"></h3>
            <div dangerouslySetInnerHTML={{ __html: details }}></div>
          </div>
        </div>
      </div>
      <footer className="text-center p-2 bg-blue-900 text-white flex-shrink-0">
        <p>&copy; 2024 WESEE Indian Naval</p>
      </footer>
    </>
  );
};

export default ZoomableCirclePacking;


//for online API
// "use client";
// import { useEffect, useRef, useState } from "react";
// import * as d3 from "d3";

// const ZoomableCirclePacking = () => {
//   const svgRef = useRef(null);
//   const [details, setDetails] = useState("");
//   const [data, setData] = useState(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await fetch("http://localhost:3069/api/data");
//         const jsonData = await response.json();
//         // Transform the API data to match the offline data structure
//         console.log("API DATA",jsonData);
        
//         // const transformedData = transformApiData(jsonData);

//         setData(jsonData);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       }
//     };

//     fetchData();
//   }, []);

//   // Function to transform API data to match offline data structure
//   const transformApiData = (apiData) => {
//     return {
//       name: "Network Security",
//       children: Object.entries(apiData).map(([category, items]) => ({
//         name: category,
//         children: items.map(item => ({
//           name: item.name,
//           companyName: item.companyName,
//           contactPerson: item.contactPerson,
//           website: item.website,
//           about: item.about,
//           location: item.location,
//           products: item.products,
//           children: [{ name: item.name }]
//         }))
//       }))
//     };
//   };

//   useEffect(() => {
//     if (!data) return;

//     // Chart dimensions
//     const width = 928;
//     const height = width;

//     // Create color scale
//     const color = d3
//       .scaleLinear()
//       .domain([0, 5])
//       .range(["#003366", "#00CCCC"])
//       .interpolate(d3.interpolateHcl);

//     // Compute the layout
//     const pack = (data) =>
//       d3.pack().size([width, height]).padding(3)(
//         d3
//           .hierarchy(data)
//           .sum((d) => (d.children ? 0 : 1))
//           .sort((a, b) => b.value - a.value)
//       );
//     const root = pack(data);

//     // Create SVG container
//     const svg = d3
//       .select(svgRef.current)
//       .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
//       .attr("width", width)
//       .attr("height", height)
//       .attr(
//         "style",
//         `max-width: 100%; height: auto; display: block; margin: 0 auto; background: ${color(
//           0
//         )}; cursor: pointer;`
//       );

//     // Append the nodes
//     const getRandomColor = () => {
//       const r = Math.floor(Math.random() * 156 + 100);
//       const g = Math.floor(Math.random() * 156 + 100);
//       const b = Math.floor(Math.random() * 156 + 100);
//       return `#${r.toString(16).padStart(2, "0")}${g
//         .toString(16)
//         .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
//     };
//     const node = svg
//       .append("g")
//       .selectAll("circle")
//       .data(root.descendants().slice(1))
//       .join("circle")
//       .attr("fill", (d) => (d.children ? color(d.depth) : getRandomColor()))
//       .attr("pointer-events", (d) => (!d.children ? "none" : null))
//       .on("mouseover", function () {
//         d3.select(this).attr("stroke", "#FFD700");
//       })
//       .on("mouseout", function () {
//         d3.select(this).attr("stroke", null);
//       })
//       .on("click", (event, d) => {
//         setDetails(formatDetails(d));
//         focus !== d && (zoom(event, d), event.stopPropagation());
//       });

//     // Append the text labels
//     const label = svg
//       .append("g")
//       .style("font", "32px sans-serif")
//       .attr("pointer-events", "none")
//       .attr("text-anchor", "middle")
//       .selectAll("text")
//       .data(root.descendants())
//       .join("text")
//       .style("fill-opacity", (d) => (d.parent === root ? 1 : 0))
//       .style("display", (d) => (d.parent === root ? "inline" : "none"))
//       .text((d) => d.data.name);

//     // Zoom functionality
//     svg.on("click", (event) => zoom(event, root));
//     let focus = root;
//     let view;
//     zoomTo([focus.x, focus.y, focus.r * 2]);

//     function zoomTo(v) {
//       const k = width / v[2];
//       view = v;
//       label.attr(
//         "transform",
//         (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
//       );
//       node.attr(
//         "transform",
//         (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
//       );
//       node.attr("r", (d) => d.r * k);
//     }

//     function zoom(event, d) {
//       const focus0 = focus;
//       focus = d;
//       const transition = svg
//         .transition()
//         .duration(event.altKey ? 7500 : 750)
//         .tween("zoom", (d) => {
//           const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
//           return (t) => zoomTo(i(t));
//         });

//       label
//         .filter(function (d) {
//           return d.parent === focus || this.style.display === "inline";
//         })
//         .transition(transition)
//         .style("fill-opacity", (d) => (d.parent === focus ? 1 : 0))
//         .on("start", function (d) {
//           if (d.parent === focus) this.style.display = "inline";
//         })
//         .on("end", function (d) {
//           if (d.parent !== focus) this.style.display = "none";
//         });
//     }

//     function formatDetails(node) {
//       if (node === root) {
//         const totalResearchAreas = root.children.length;
//         const totalVendors = root.leaves().length;
//         return `
//           <div class="summary-details">
//             <h2 class="text-5xl font-bold text-purple-700 mb-8 ">Vendors Details</h2>
//             <p class="mb-6 text-3xl"><strong>Total Research Areas:</strong> ${totalResearchAreas}</p>
//             <p class="mb-6 text-3xl"><strong>Total Vendors:</strong> ${totalVendors}</p>
//           </div>
//         `;
//       } else if (node.depth === 1 || node.depth === 2) {
//         const subResearchAreas = node.children ? node.children.length : 0;
//         const vendorList = node.leaves()
//           .map((leaf) => leaf.data.name)
//           .join(", ");
//         return `
//           <div class="research-area-details">
//             <h2 class="text-5xl font-bold text-purple-700 mb-8 ">${node.data.name}</h2>
//             <p class="mb-6 text-3xl"><strong>Sub-research Areas:</strong> ${subResearchAreas}</p>
//             <p class="mb-6 text-3xl"><strong>Vendors:</strong> ${vendorList}</p>
//           </div>
//         `;
//       } else if (node.data.companyName) {
//         return `
//           <div class="vendor-details">
//             <h2 class="text-5xl font-bold text-purple-700 mb-8 ">${node.data.companyName}</h2>
//             <p class="mb-6 text-3xl"><strong>Contact:</strong> ${node.data.contactPerson}</p>
//             <p class="mb-6 text-3xl"><strong>Website:</strong> <a href="https://${node.data.website}" target="_blank" rel="noopener noreferrer">${node.data.website}</a></p>
//             <p class="mb-6 text-3xl"><strong>Location:</strong> ${node.data.location}</p>
//             <p class="mb-6 text-3xl"><strong>About:</strong> ${node.data.about}</p>
//             <h3 class="text-lg font-semibold mt-4 mb-2">Products:</h3>
//             <ul class="list-disc pl-5">
//               ${node.data.products
//                 ? node.data.products.map((product) => `<li>${product}</li>`).join("")
//                 : "No products listed"
//               }
//             </ul>
//           </div>
//         `;
//       }
//       return `<div><strong>${node.data.name}</strong></div>`;
//     }

//     function handleKeyDown(event) {
//       if (event.key === "Escape") {
//         setDetails(formatDetails(root));
//         zoom(event, root);
//       }
//     }

//     window.addEventListener("keydown", handleKeyDown);
//     setDetails(formatDetails(root));

//     return () => {
//       window.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [data]);

//   return (
//     <>
//       <div className="flex flex-row h-screen">
//         <div className="flex flex-grow justify-center bg-gray-100 overflow-hidden">
//           <svg ref={svgRef} className="h-4/5 max-h-full"></svg>
//           <div className="ml-5 p-4 bg-white border border-blue-900 bg- w-1/3 h-4/5 overflow-y-auto">
//             <h3 className="text-lg font-semibold mb-4 text-purple-600"></h3>
//             <div dangerouslySetInnerHTML={{ __html: details }}></div>
//           </div>
//         </div>
//       </div>
//       <footer className="text-center p-2 bg-blue-900 text-white flex-shrink-0">
//         <p>&copy; 2024 WESEE Indian Naval</p>
//       </footer>
//     </>
//   );
// };

// export default ZoomableCirclePacking;