import * as cornerstone from '../cornerstone-core.js';
import * as cornerstoneMath from '../cornerstone-math.js';
import mouseButtonTool from './mouseButtonTool.js';
import toolColors from '../stateManagement/toolColors.js';
import textStyle from '../stateManagement/textStyle.js';
import drawHandles from '../manipulators/drawHandles.js';
import drawTextBox from '../util/drawTextBox.js';
import { getToolState } from '../stateManagement/toolState.js';

const toolType = 'probeLabel';

// /////// BEGIN ACTIVE TOOL ///////
function createNewMeasurement (mouseEventData) {
    // Create the measurement data for this tool with the end handle activated
  const measurementData = {
    visible: true,
    active: true,
    handles: {
      end: {
        x: mouseEventData.currentPoints.image.x,
        y: mouseEventData.currentPoints.image.y,
        highlight: true,
        active: true
      },
      textBox: {
        labelValue: ' '
      }
    }
  };


  return measurementData;
}
// /////// END ACTIVE TOOL ///////

// /////// BEGIN IMAGE RENDERING ///////
function pointNearTool (element, data, coords) {
  const endCanvas = cornerstone.pixelToCanvas(element, data.handles.end);


  return cornerstoneMath.point.distance(endCanvas, coords) < 5;
}

function onImageRendered (e, eventData) {
  // If we have no toolData for this element, return immediately as there is nothing to do
  const toolData = getToolState(e.currentTarget, toolType);

  if (!toolData) {
    return;
  }

    // We have tool data for this element - iterate over each one and draw it
  const context = eventData.canvasContext.canvas.getContext('2d');

  context.setTransform(1, 0, 0, 1, 0, 0);

  let color;
  const font = textStyle.getFont();
  const fontHeight = textStyle.getFontSize();

  for (let i = 0; i < toolData.data.length; i++) {

    context.save();
    const data = toolData.data[i];

    if (data.active) {
      color = toolColors.getActiveColor();
    } else {
      color = toolColors.getToolColor();
    }

        // Draw the handles
    drawHandles(context, eventData, data.handles, color);

    const x = Math.round(data.handles.end.x);
    const y = Math.round(data.handles.end.y);

    const str = data.handles.textBox.labelValue;

    if (x < 0 || y < 0 || x >= eventData.image.columns || y >= eventData.image.rows) {
      return;
    }

    const coords = {
            // Translate the x/y away from the cursor
      x: data.handles.end.x + 3,
      y: data.handles.end.y - 3
    };
    const textCoords = cornerstone.pixelToCanvas(eventData.element, coords);

    context.font = font;
    context.fillStyle = color;

    drawTextBox(context, str, textCoords.x, textCoords.y + fontHeight + 5, color);
    context.restore();
  }
}
// /////// END IMAGE RENDERING ///////

// Module exports
const probeLabel = mouseButtonTool({
  createNewMeasurement,
  onImageRendered,
  pointNearTool,
  toolType
});


export {
  probeLabel
};
