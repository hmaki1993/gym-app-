import os
from PIL import Image
import colorsys

def tint_image(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        r, g, b, a = item
        
        # Skip fully transparent pixels
        if a == 0:
            new_data.append(item)
            continue
            
        # Convert RGB to HSV
        # RGB are 0-255 in PIL, colorsys expects 0-1
        h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)
        
        # Check if the pixel has color (is not grayscale)
        # s > 0.05 means it has some color
        # We want to change the green (H ~ 0.3-0.5) and blue (H ~ 0.5-0.7) to orange (H ~ 0.07-0.09)
        if s > 0.08:
            # Target Hues between 50 degrees (0.13) and 260 degrees (0.72)
            # This covers green, cyan, blue
            if 0.12 < h < 0.75:
                # Set hue to orange (around 28 degrees = 0.078)
                h = 0.078
                # Boost saturation slightly for the orange to pop nicely
                s = min(1.0, s * 1.1)
                
        # Convert back to RGB
        r_new, g_new, b_new = colorsys.hsv_to_rgb(h, s, v)
        new_data.append((int(r_new * 255), int(g_new * 255), int(b_new * 255), a))
        
    img.putdata(new_data)
    img.save(output_path)
    print(f"Successfully tinted image and saved to {output_path}")

if __name__ == "__main__":
    src = r"f:\MyRestoredProjects\GymLog\public\assets\calendar-custom.png"
    dst = r"f:\MyRestoredProjects\GymLog\public\assets\calendar-custom.png"
    tint_image(src, dst)
