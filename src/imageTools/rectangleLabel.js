import * as cornerstone from '../cornerstone-core.js';
import * as cornerstoneMath from '../cornerstone-math.js';
import mouseButtonTool from './mouseButtonTool.js';
import toolStyle from '../stateManagement/toolStyle.js';
import toolColors from '../stateManagement/toolColors.js';
import drawHandles from '../manipulators/drawHandles.js';
import drawTextBox from '../util/drawTextBox.js';
import { removeToolState, getToolState } from '../stateManagement/toolState.js';
import getHandleNearImagePoint from '../manipulators/getHandleNearImagePoint.js';
import moveHandle from '../manipulators/moveHandle.js';
import moveAllHandles from '../manipulators/moveAllHandles.js';
import anyHandlesOutsideImage from '../manipulators/anyHandlesOutsideImage.js';
import isMouseButtonEnabled from '../util/isMouseButtonEnabled.js';
import toolCoordinates from '../stateManagement/toolCoordinates.js';
import handleActivator from '../manipulators/handleActivator.js';

const toolType = 'rectangleLabel';
const save_freeze = false;
// /////// BEGIN ACTIVE TOOL ///////

function createNewMeasurement (mouseEventData) {
    // Create the measurement data for this tool with the end handle activated
  const measurementData = {
    active: true,
    save: false,
    controls: {
      remove: {
        x: mouseEventData.currentPoints.image.x,
        y: mouseEventData.currentPoints.image.y
      },
      save: {
        x: mouseEventData.currentPoints.image.x,
        y: mouseEventData.currentPoints.image.y
      }
    },
    handles: {
      start: {
        x: mouseEventData.currentPoints.image.x,
        y: mouseEventData.currentPoints.image.y,
        highlight: true,
        active: false
      },
      end: {
        x: mouseEventData.currentPoints.image.x,
        y: mouseEventData.currentPoints.image.y,
        highlight: true,
        active: true
      },
      textBox: {
        active: false,
        labelValue: ' ',
        hasMoved: false,
        movesIndependently: false,
        drawnIndependently: true,
        allowedOutsideImage: true,
        hasBoundingBox: true
      }
    }
  };

  return measurementData;
}
// /////// END ACTIVE TOOL ///////

function pointNearTool (element, data, coords) {
  const startCanvas = cornerstone.pixelToCanvas(element, data.handles.start);
  const endCanvas = cornerstone.pixelToCanvas(element, data.handles.end);

  const rect = {
    left: Math.min(startCanvas.x, endCanvas.x),
    top: Math.min(startCanvas.y, endCanvas.y),
    width: Math.abs(startCanvas.x - endCanvas.x),
    height: Math.abs(startCanvas.y - endCanvas.y)
  };

  const distanceToPoint = cornerstoneMath.rect.distanceToPoint(rect, coords);


  return (distanceToPoint < 5);
}

// /////// BEGIN IMAGE RENDERING ///////

function xyOnArc (handle, radius, radianAngle) {
  const radianAngles = radianAngle * Math.PI;
  const x = handle.x + radius * Math.cos(radianAngles);
  const y = handle.y + radius * Math.sin(radianAngles);

  return ({
    x,
    y
  });
}

function onImageRendered (e, eventData) {
    // If we have no toolData for this element, return immediately as there is nothing to do
  const toolData = getToolState(e.currentTarget, toolType);

  if (!toolData) {
    return;
  }

  const element = eventData.element;
  const lineWidth = toolStyle.getToolWidth();
  const config = rectangleLabel.getConfiguration();
  const context = eventData.canvasContext.canvas.getContext('2d');

  context.setTransform(1, 0, 0, 1, 0, 0);

    // If we have tool data for this element - iterate over each set and draw it
  for (let i = 0; i < toolData.data.length; i++) {
    context.save();

    const data = toolData.data[i];

        // Apply any shadow settings defined in the tool configuration
    if (config && config.shadow) {
      context.shadowColor = config.shadowColor || '#000000';
      context.shadowOffsetX = config.shadowOffsetX || 1;
      context.shadowOffsetY = config.shadowOffsetY || 1;
    }

        // Check which color the rendered tool should be
    const color = toolColors.getColorIfActive(data.active);

        // Convert Image coordinates to Canvas coordinates given the element
    const handleStartCanvas = cornerstone.pixelToCanvas(element, data.handles.start);
    const handleEndCanvas = cornerstone.pixelToCanvas(element, data.handles.end);

        // Retrieve the bounds of the ellipse (left, top, width, and height)
        // In Canvas coordinates
    const leftCanvas = Math.min(handleStartCanvas.x, handleEndCanvas.x);
    const rightCanvas = Math.max(handleStartCanvas.x, handleEndCanvas.x);
    const topCanvas = Math.min(handleStartCanvas.y, handleEndCanvas.y);
    const bottomCanvas = Math.max(handleStartCanvas.y, handleEndCanvas.y);
    const widthCanvas = Math.abs(handleStartCanvas.x - handleEndCanvas.x);
    const heightCanvas = Math.abs(handleStartCanvas.y - handleEndCanvas.y);

    const pointWidth = 2;
    const centertopCanvas = Math.abs(topCanvas + heightCanvas / 2) - pointWidth;
    const centerleftCanvas = Math.abs(leftCanvas + widthCanvas / 2) - pointWidth;

        // Draw the rectangle on the canvas
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.rect(leftCanvas, topCanvas, widthCanvas, heightCanvas);
    context.stroke();
    context.beginPath();
    context.rect(centerleftCanvas, centertopCanvas, pointWidth, pointWidth);
    context.stroke();

    if (handleStartCanvas.y > handleEndCanvas.y) {
      data.controls.save.y = topCanvas;
      data.controls.remove.y = bottomCanvas;
    } else {
      data.controls.remove.y = topCanvas;
      data.controls.save.y = bottomCanvas;
    }
    if (handleStartCanvas.x < handleEndCanvas.x) {
      data.controls.remove.x = rightCanvas;
      data.controls.save.x = leftCanvas;
    } else {
      data.controls.remove.x = leftCanvas;
      data.controls.save.x = rightCanvas;
    }
    let start;
    let stop;

    if (data.save === false) {
      context.beginPath();
      context.fillStyle = '#228B22'; // Green
      context.arc(data.controls.save.x, data.controls.save.y, 6, 0, 2 * Math.PI);
      context.closePath();
      context.fill();
      context.beginPath();
      context.strokeStyle = '#000000';
      context.lineWidth = 2;
      start = xyOnArc(data.controls.save, 6, 0.50);
      stop = xyOnArc(data.controls.save, 6, 1.50);
      context.moveTo(start.x, start.y);
      context.lineTo(stop.x, stop.y);
      context.stroke();
      context.beginPath();
      start = xyOnArc(data.controls.save, 6, 0);
      stop = xyOnArc(data.controls.save, 6, 1);
      context.moveTo(start.x, start.y);
      context.lineTo(stop.x, stop.y);
      context.stroke();
    }
    if (data.active === true) {
      context.beginPath();
      context.fillStyle = '#c82124'; // Red
      context.arc(data.controls.remove.x, data.controls.remove.y, 6, 0, 2 * Math.PI);
      context.closePath();
      context.fill();
      context.beginPath();
      context.strokeStyle = '#000000'; // Black
      context.lineWidth = 1.5;
      start = xyOnArc(data.controls.remove, 6, 0.25);
      stop = xyOnArc(data.controls.remove, 6, 1.25);
      context.moveTo(start.x, start.y);
      context.lineTo(stop.x, stop.y);
      context.stroke();
      context.beginPath();
      start = xyOnArc(data.controls.remove, 6, 0.75);
      stop = xyOnArc(data.controls.remove, 6, 1.75);
      context.moveTo(start.x, start.y);
      context.lineTo(stop.x, stop.y);
      context.stroke();

            // If the tool configuration specifies to only draw the handles on hover / active,
            // Follow this logic
            // Draw the handles if the tool is active
      if (save_freeze === false) {
        drawHandles(context, eventData, data.handles, color);
      } else if (data.save === false) {
        drawHandles(context, eventData, data.handles, color);
      }
    }

        // Define variables for the area and mean/standard deviation

        // Perform a check to see if the tool has been invalidated. This is to prevent
        // Unnecessary re-calculation of the area, mean, and standard deviation if the
        // Image is re-rendered but the tool has not moved (e.g. during a zoom)

        // Define an array to store the rows of text for the textbox
    const textLines = [];

        // If the mean and standard deviation values are present, display them
    textLines.push(data.handles.textBox.labelValue);

        // If the area is a sane value, display it

        // If the textbox has not been moved by the user, it should be displayed on the right-most
        // Side of the tool.
    if (!data.handles.textBox.hasMoved) {
            // Find the rightmost side of the ellipse at its vertical center, and place the textbox here
            // Note that this calculates it in image coordinates
      data.handles.textBox.x = Math.max(data.handles.start.x, data.handles.end.x);
      data.handles.textBox.y = (data.handles.start.y + data.handles.end.y) / 2;
    }

        // Convert the textbox Image coordinates into Canvas coordinates
    const textCoords = cornerstone.pixelToCanvas(element, data.handles.textBox);

        // Set options for the textbox drawing function
    const options = {
      centering: {
        x: false,
        y: true
      }
    };

        // Draw the textbox and retrieves it's bounding box for mouse-dragging and highlighting
    const boundingBox = drawTextBox(context, textLines, textCoords.x,
            textCoords.y, color, options);

        // Store the bounding box data in the handle for mouse-dragging and highlighting
    data.handles.textBox.boundingBox = boundingBox;

        // If the textbox has moved, we would like to draw a line linking it with the tool
        // This section decides where to draw this line to on the Ellipse based on the location
        // Of the textbox relative to the ellipse.
    if (data.handles.textBox.hasMoved) {
            // Draw dashed link line between tool and text

            // The initial link position is at the center of the
            // Textbox.
      const link = {
        start: {},
        end: {
          x: textCoords.x,
          y: textCoords.y
        }
      };

            // First we calculate the ellipse points (top, left, right, and bottom)
      const ellipsePoints = [{
                // Top middle point of ellipse
        x: leftCanvas + widthCanvas / 2,
        y: topCanvas
      }, {
                // Left middle point of ellipse
        x: leftCanvas,
        y: topCanvas + heightCanvas / 2
      }, {
                // Bottom middle point of ellipse
        x: leftCanvas + widthCanvas / 2,
        y: topCanvas + heightCanvas
      }, {
                // Right middle point of ellipse
        x: leftCanvas + widthCanvas,
        y: topCanvas + heightCanvas / 2
      }];

            // We obtain the link starting point by finding the closest point on the ellipse to the
            // Center of the textbox
      link.start = cornerstoneMath.point.findClosestPoint(ellipsePoints, link.end);

            // Next we calculate the corners of the textbox bounding box
      const boundingBoxPoints = [{
                // Top middle point of bounding box
        x: boundingBox.left + boundingBox.width / 2,
        y: boundingBox.top
      }, {
                // Left middle point of bounding box
        x: boundingBox.left,
        y: boundingBox.top + boundingBox.height / 2
      }, {
                // Bottom middle point of bounding box
        x: boundingBox.left + boundingBox.width / 2,
        y: boundingBox.top + boundingBox.height
      }, {
                // Right middle point of bounding box
        x: boundingBox.left + boundingBox.width,
        y: boundingBox.top + boundingBox.height / 2
      }];

            // Now we recalculate the link endpoint by identifying which corner of the bounding box
            // Is closest to the start point we just calculated.
      link.end = cornerstoneMath.point.findClosestPoint(boundingBoxPoints, link.start);

            // Finally we draw the dashed linking line
      context.beginPath();
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      context.setLineDash([2, 3]);
      context.moveTo(link.start.x, link.start.y);
      context.lineTo(link.end.x, link.end.y);
      context.stroke();
    }

    context.restore();
  }
}

function getControlNearImagePoint (controls, coords, distanceThreshold) {
  let nearbyControl;

  if (!controls) {
    return;
  }

  Object.keys(controls).forEach(function (name) {
    const control = controls[name];
    const distance = cornerstoneMath.point.distance(control, coords);

    if (distance <= distanceThreshold) {
      nearbyControl = name;
    }
  });

  return nearbyControl;
}

function mouseMoveCallback (e, eventData) {
  toolCoordinates.setCoords(eventData);
    // If a mouse button is down, do nothing
  if (eventData.which !== 0) {
    return;
  }

    // If we have no tool data for this element, do nothing
  const toolData = getToolState(eventData.element, toolType);

  if (!toolData) {
    return;
  }

    // We have tool data, search through all data
    // And see if we can activate a handle
  let imageNeedsUpdate = false;

  for (let i = 0; i < toolData.data.length; i++) {
        // Get the cursor position in canvas coordinates
    const coords = eventData.currentPoints.canvas;

    const data = toolData.data[i];

    if (handleActivator(eventData.element, data.handles, coords) === true) {
      imageNeedsUpdate = true;
    }

    if ((pointNearTool(eventData.element, data, coords) && !data.active) || (!pointNearTool(eventData.element, data, coords) && data.active)) {
      data.active = !data.active;
      imageNeedsUpdate = true;
    }
  }

    // Handle activation status changed, redraw the image
  if (imageNeedsUpdate === true) {
    cornerstone.updateImage(eventData.element);
  }
}
function mouseDownCallback (e, eventData) {
  let data;
  const element = eventData.element;

  const options = {
    deleteIfHandleOutsideImage: false,
    preventHandleOutsideImage: true
  };

  function handleDoneMove () {
    data.invalidated = true;
    const eventType = 'CornerstoneToolsMeasurementMoved';
    const modifiedEventData = {
      toolType,
      element,
      measurementData: data
    };

    $(element).trigger(eventType, modifiedEventData);
    cornerstone.updateImage(element);
    $(element).on('CornerstoneToolsMouseMove', eventData, mouseMoveCallback);
  }

  if (!isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
    return;
  }

  const coords = eventData.startPoints.canvas;
  const toolData = getToolState(e.currentTarget, toolType);

  if (!toolData) {
    return;
  }

  let i;

  for (i = 0; i < toolData.data.length; i++) {
    data = toolData.data[i];
    const distance = 6;
    const handle = getHandleNearImagePoint(element, data.handles, coords, distance);
    const control = getControlNearImagePoint(data.controls, coords, distance);

    if (handle && (data.save === false || save_freeze === false)) {
      $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
      data.active = true;
      moveHandle(eventData, toolType, data, handle, handleDoneMove, options.preventHandleOutsideImage);
      e.stopImmediatePropagation();

      return false;
    }
    if (control) {
      if (control === 'remove') {
        removeToolState(element, toolType, data);
        cornerstone.updateImage(element);
      }
      if (control === 'save') {
        data.save = true;
        const eventType = 'CornerstoneToolsMeasurementSaved';
        const modifiedEventData = {
          toolType,
          element,
          measurementData: data
        };

        $(element).trigger(eventType, modifiedEventData);
        cornerstone.updateImage(element);
      }
    }
  }

    // Now check to see if there is a line we can move
    // Now check to see if we have a tool that we can move
  if (!pointNearTool) {
    return;
  }


  for (i = 0; i < toolData.data.length; i++) {
    data = toolData.data[i];
    data.active = false;
    if (pointNearTool(element, data, coords)) {
      data.active = true;
      if (data.save === false) {
        $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
        moveAllHandles(e, data, toolData, toolType, options, handleDoneMove);
      }
      e.stopImmediatePropagation();

      return false;
    }
  }
}
// /////// END IMAGE RENDERING ///////

// Module exports
const rectangleLabel = mouseButtonTool({
  onImageRendered,
  createNewMeasurement,
  pointNearTool,
  toolType,
  mouseDownCallback,
  mouseMoveCallback
});

export {
    rectangleLabel
};
