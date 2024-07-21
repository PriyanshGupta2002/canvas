"use client";
import { generateUniqueId } from "@/utils/generate-unique-id";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface widthHeightProps {
  innerWidth: string;
  innerHeight: string;
}

interface coordinates {
  x: number;
  y: number;
}

interface Rectangle {
  startX: number;
  startY: number;
  width: number;
  height: number;
  id: string;
  color: string;
}

const Canvas = (props: any) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [widthHeight, setWindowHeight] = useState<widthHeightProps>();
  const [startCoordinates, setStartCoordinates] =
    useState<coordinates | null>();
  const [endCoordinates, setEndCoordinates] = useState<coordinates | null>();
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [text, setText] = useState<string>("");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<"rect" | "text">("rect");
  const [selectedRectangleId, setSelectedRectangleId] = useState<string | null>(
    null
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const lastDrawnTimeRef = useRef<number>(0);

  const handleWindowResize = useCallback(() => {
    const { innerHeight, innerWidth } = window;
    const calcInnerHeight = (innerHeight / 100) * 80;
    const calcInnerWidth = (innerWidth / 100) * 50;
    setWindowHeight({
      innerHeight: calcInnerHeight.toString(),
      innerWidth: calcInnerWidth.toString(),
    });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartCoordinates({ x, y });
        setText("");
        setIsDrawing(true);
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      if (!startCoordinates || !isDrawing) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setEndCoordinates({ x, y });
      }
    },
    [startCoordinates, isDrawing]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect && startCoordinates && isDrawing) {
        const newEndCoordinates = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        const newRectangle: Rectangle = {
          startX: Math.min(startCoordinates.x, newEndCoordinates.x),
          startY: Math.min(startCoordinates.y, newEndCoordinates.y),
          width: Math.abs(newEndCoordinates.x - startCoordinates.x),
          height: Math.abs(newEndCoordinates.y - startCoordinates.y),
          id: generateUniqueId(),
          color: "rgba(140, 68, 19, 0.5)", // Default color
        };

        if (
          newRectangle.width > 5 &&
          newRectangle.height > 5 &&
          mode === "rect"
        ) {
          setRectangles((prevRectangles) => [...prevRectangles, newRectangle]);
          lastDrawnTimeRef.current = Date.now();
        }

        setStartCoordinates(null);
        setEndCoordinates(null);
        setIsDrawing(false);
      }
    },
    [mode, startCoordinates, isDrawing]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      // Ignore clicks immediately after drawing
      if (Date.now() - lastDrawnTimeRef.current < 200) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let clickedRectId: string | null = null;

        const updatedRectangles = rectangles.map((rectangle) => {
          if (
            x >= rectangle.startX &&
            x <= rectangle.startX + rectangle.width &&
            y >= rectangle.startY &&
            y <= rectangle.startY + rectangle.height
          ) {
            clickedRectId = rectangle.id;
            return {
              ...rectangle,
              color: "rgba(255, 0, 0, 0.5)", // Red color for selected rectangle
            };
          }
          return {
            ...rectangle,
            color: "rgba(140, 68, 19, 0.5)", // Default color for unselected rectangles
          };
        });

        if (clickedRectId !== selectedRectangleId) {
          setRectangles(updatedRectangles);
          setSelectedRectangleId(clickedRectId);
        } else {
          // If clicking the same rectangle, deselect it
          setRectangles(
            rectangles.map((rect) => ({
              ...rect,
              color: "rgba(140, 68, 19, 0.5)",
            }))
          );
          setSelectedRectangleId(null);
        }
      }
    },
    [rectangles, selectedRectangleId]
  );

  console.log(rectangles);
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before drawing

    // Draw image
    if (image) {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    }

    // Draw rectangles
    rectangles.forEach((item) => {
      context.strokeStyle = item.color;
      context.strokeRect(item.startX, item.startY, item.width, item.height);
    });

    // Draw the rectangle being drawn
    if (startCoordinates && endCoordinates) {
      const x = Math.min(startCoordinates.x, endCoordinates.x);
      const y = Math.min(startCoordinates.y, endCoordinates.y);
      const width = Math.abs(endCoordinates.x - startCoordinates.x);
      const height = Math.abs(endCoordinates.y - startCoordinates.y);
      context.strokeStyle = "rgba(140, 68, 19, 0.5)";
      context.strokeRect(x, y, width, height);
    }

    // Draw text
    if (startCoordinates && mode === "text") {
      context.font = "48px serif";
      context.fillStyle = "red";
      context.fillText(text, startCoordinates.x, startCoordinates.y);
      // Draw cursor
      const textWidth = context.measureText(text).width;
      context.fillRect(
        startCoordinates.x + textWidth,
        startCoordinates.y - 48,
        2,
        70
      );
    }
  }, [image, mode, rectangles, startCoordinates, endCoordinates, text]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (startCoordinates) {
        if (e.key === "Backspace") {
          setText((prevText) => prevText.slice(0, -1));
        } else if (e.key.length === 1) {
          setText((prevText) => prevText + e.key);
        }
      }
    },
    [startCoordinates]
  );

  const loadImage = useCallback((url: string) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setImage(img);
    };
  }, []);

  useEffect(() => {
    loadImage(
      "https://images.unsplash.com/photo-1721146378270-1b93839f7ae7?q=80&w=1771&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    );
  }, [loadImage]);

  useEffect(() => {
    drawCanvas();
  }, [image, rectangles, text, drawCanvas]);

  useEffect(() => {
    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleWindowResize, handleKeyDown]);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as "text" | "rect")}
      >
        <option value="rect">Rect</option>
        <option value="text">Text</option>
      </select>
      <canvas
        ref={canvasRef}
        {...props}
        width={widthHeight?.innerWidth}
        height={widthHeight?.innerHeight}
        className="bg-slate-300"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
    </div>
  );
};

export default Canvas;
