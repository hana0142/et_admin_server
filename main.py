import sys
import os
import argparse
import time
from datetime import datetime
import cv2
import numpy as np
import pyautogui
import psycopg2 as pg
from pytz import timezone
from gaze_tracker import GazeTracker
from calibration import calibrate
from screen import Screen

#URL = "http://192.168.1.5:8080/video" # Your url might be different, check the app

RES_SCREEN = pyautogui.size() # RES_SCREEN[0] -> width
                              # RES_SCREEN[1] -> heigth
SCREEN_WIDTH = 1280
SCREEN_HEIGHT = 720

FRAME_WIDTH = 640
FRAME_HEIGHT = 480

def nothing(val):
    pass

connection = pg.connect(user="hana",password="hana",host="10.214.26.112",port="5432",database="db_user")
now = datetime.now()
now_date = now.strftime('%Y%m%d')
now_time = now.strftime('%H%M%S')
oper_no = str(now_date) + str(now_time)

cursor = connection.cursor()
cursor.execute("""
    INSERT INTO tb_oper
    VALUES (DEFAULT, %s, %s, current_timestamp);
    """,(str(sys.argv[1]),oper_no))
cursor.close()

def main():

    # remote source
    #camera = cv2.VideoCapture(URL)
    
    # webcam source
    camera = cv2.VideoCapture(1)
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

    gaze_tracker = GazeTracker()
    screen = Screen(SCREEN_WIDTH, SCREEN_HEIGHT)

    cv2.namedWindow("frame")
    cv2.createTrackbar('threshold', 'frame', 0, 255, nothing)
    cv2.setTrackbarPos('threshold', 'frame', 1)

    screen.clean()
    screen.show()

    os.makedirs('images', exist_ok=True)

    while True:

        _, frame = camera.read() 

#        print(frame.shape)

        start = time.time()

        gaze_tracker.update(frame)

        end = time.time()

        cv2.namedWindow("frame")
        dec_frame = gaze_tracker.eye_tracker.decorate_frame()
    
        dec_frame = cv2.resize(dec_frame,(int(FRAME_WIDTH / 2), int(FRAME_HEIGHT / 2)))
        
        cv2.moveWindow("frame", 0 , 0)
        cv2.imshow('frame', dec_frame)
        cursor = connection.cursor()
        millis = datetime.now(timezone('Asia/Seoul')).strftime('%Y-%m-%d %H:%M:%S.%f')

        try:
            gaze = gaze_tracker.get_gaze()
        except:
            gaze = None
            screen.print_message("CALIBRATION REQUIRED!")
            screen.show()
            print("CALIBRATION REQUIRED!")

        print("GAZE: {}".format(gaze))
        str_gaze = str(gaze)
    
        if gaze:
            screen.update(gaze)
            screen.refresh()
            try:
                pyautogui.moveTo(gaze[0] + ((RES_SCREEN[0] - screen.width) // 2), gaze[1] + 25)
            except:
                pass
        str_vector = str_gaze[0]
        str_point = str_gaze[1]
        print("TIME: {:.3f} ms".format(end*1000 - start*1000))
        str_time = (end*1000 - start*1000)
        cursor.execute("""
            INSERT INTO tb_user_oper
            VALUES (%s, %s, %s, %s, %s, %s,current_timestamp);
            """,(str(sys.argv[1]),oper_no,str(str_gaze),str(str_time),str_time,millis))
        connection.commit()

        k = cv2.waitKey(1) & 0xff
        if k == 1048603 or k == 27: # esc to quit
            break
        if k == ord('c'): # c to calibrate
            screen.mode = "calibration"
            screen.draw_center()
            calibrate(camera, screen, gaze_tracker)

    camera.release()
    cursor.close()
    connection.close()
    cv2.destroyAllWindows()


if __name__ == '__main__':
    main()
