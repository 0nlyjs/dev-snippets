import os
import math
from PIL import Image, ImageDraw

OUTPUT_DIR = "/Users/mistjs/Documents/GitHub/dev-snippets/assets/images/tabIcons/"

def create_star(draw, center, r_outer, r_inner, fill_color):
    cx, cy = center
    points = []
    for i in range(10):
        r = r_outer if i % 2 == 0 else r_inner
        angle = i * math.pi / 5 - math.pi / 2
        x = cx + r * math.cos(angle)
        y = cy + r * math.sin(angle)
        points.append((x, y))
    draw.polygon(points, fill=fill_color)

def create_plus(draw, width, height, stroke, fill_color):
    cx, cy = width / 2, height / 2
    # Vertical bar
    draw.rectangle([cx - stroke / 2, height * 0.22, cx + stroke / 2, height * 0.78], fill=fill_color)
    # Horizontal bar
    draw.rectangle([width * 0.22, cy - stroke / 2, width * 0.78, cy + stroke / 2], fill=fill_color)

def create_folder(draw, width, height, fill_color):
    # Scale coordinates based on size
    pad_x = width * 0.125
    pad_y = height * 0.2
    
    # Body
    draw.rectangle([pad_x, pad_y + height * 0.1, width - pad_x, height - pad_y], fill=fill_color)
    # Tab
    draw.polygon([
        (pad_x, pad_y + height * 0.1),
        (pad_x, pad_y - height * 0.05),
        (pad_x + width * 0.25, pad_y - height * 0.05),
        (pad_x + width * 0.35, pad_y + height * 0.1)
    ], fill=fill_color)

def create_gear(draw, center, r_outer, r_inner, teeth_count, fill_color):
    cx, cy = center
    # Main outer circle
    draw.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], fill=fill_color)
    
    # Draw teeth projecting outwards
    tooth_r = r_outer * 0.25
    for i in range(teeth_count):
        angle = i * 2 * math.pi / teeth_count
        tx = cx + r_outer * math.cos(angle)
        ty = cy + r_outer * math.sin(angle)
        draw.ellipse([tx - tooth_r, ty - tooth_r, tx + tooth_r, ty + tooth_r], fill=fill_color)
        
    # Central transparent hole
    draw.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner], fill=(0, 0, 0, 0))

def generate_icons():
    scales = {
        "": 1,
        "@2x": 2,
        "@3x": 3
    }
    
    for suffix, scale in scales.items():
        size = 48 * scale
        center = (size / 2, size / 2)
        black = (0, 0, 0, 255)
        
        # 1. Favorites Icon (Star)
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        create_star(draw, center, 18 * scale, 8 * scale, black)
        img.save(os.path.join(OUTPUT_DIR, f"favorites{suffix}.png"))
        
        # 2. Create Icon (Plus)
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        create_plus(draw, size, size, 6 * scale, black)
        img.save(os.path.join(OUTPUT_DIR, f"create{suffix}.png"))
        
        # 3. Files Icon (Folder)
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        create_folder(draw, size, size, black)
        img.save(os.path.join(OUTPUT_DIR, f"files{suffix}.png"))
        
        # 4. Settings Icon (Gear)
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        create_gear(draw, center, 13 * scale, 5 * scale, 8, black)
        img.save(os.path.join(OUTPUT_DIR, f"settings{suffix}.png"))

    print("Successfully generated all bottom tab icons in 1x, @2x, and @3x resolutions!")

if __name__ == "__main__":
    generate_icons()
