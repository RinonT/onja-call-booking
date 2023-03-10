import React, { FC, useCallback, useState } from "react";
import { Box, Button, Modal, SelectChangeEvent, TextField, Typography } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { fetchBookingsByUser } from "../../redux/actions/bookings";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import SelectInput from "../Select/SelectInput";
import DatePicker from "../datePicker/DatePicker";
import { ErrorMessage, RoomType } from "../../utils/types";
import { getSelectedTimeMinutes, newDateGenerator, timeConverter } from "../../utils/dateUtils";
import { bookingMutation, sendAuthorizedQuery } from '../../graphqlHelper';
import styles from './bookingModal.module.css';

interface BookingModalProps {
    rooms: RoomType[];
    repeatData: { name: string; id: string }[];
    open: boolean;
    handleClose: () => void;
    position: { x: number; y: number };
    day: Date;
    date: Date;
    startDate: Date;
    endDate: Date;
    selectedRoom: string;
    setSelectedRoom: (value: string) => void;
    errorMessage: ErrorMessage;
    setErrorMessage: (value: ErrorMessage) => void;
}

interface NewBooking {
  resourceId: string;
  title: string;
  start: String;
  end: String;
  token: String | undefined
}

const BookingModal: FC<BookingModalProps> = ({
    rooms,
    repeatData,
    open,
    handleClose,
    position,
    date,
    startDate,
    endDate,
    selectedRoom,
    setSelectedRoom,
    errorMessage,
    setErrorMessage
}) => {
  const { currentUser } = useAppSelector(state => state.users);
  const dispatch = useAppDispatch();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const selectedHour = timeConverter(start?.getHours());
  const [label, setLabel] = useState("");
  const [roomId, setRoomId] = useState(selectedRoom);
  const [repeatEvent, setRepeatEvent] = useState(repeatData[0].id);
  const [startTime, setStartTime] = useState(
    `${selectedHour}:${getSelectedTimeMinutes(date, 0)}`
  );
  const [endTime, setEndTime] = useState(
    `${selectedHour}:${getSelectedTimeMinutes(date, date?.getMinutes() + 15)}`
  );
  const { modal, box, typography, backdrop, datePickerWrapper, buttonWrapper, textField } = styles;

  const boxPosition = {
    left: position.x > 70 ? "70%" : `${position.x}%`,
    top: position.y > 518 ? 518 : position.y > 18 ? position.y : 18,
  };

  const handleStartTimeEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartTime(event.target.value);
  };

  const handleEndTimeEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(event.target.value);
  };

  const handleChange = (value: Date | null) => {
    return value;
  };

  const handleRepeatEventChange = (event: SelectChangeEvent<any>) => {
    setRepeatEvent(event.target.value);
  };

  const addNewBooking = async (userBooking: NewBooking) => {
    const { resourceId, title, start, end } = userBooking;
    const { id, token } = currentUser.login;
    
    try {
      const response = await sendAuthorizedQuery(
        bookingMutation(resourceId, title, start, end, id),
        token
      );
      const { data } = response.data;
      return data;
    } catch (error) {
      setErrorMessage(error);
    }
  };

  const handleSubmitBooking = useCallback(async () => {
    const newStartDate = String(newDateGenerator(start, startTime));
    const newEndDate = String(newDateGenerator(end, endTime));
    const { token } = currentUser.login;

      try {
        if (token && roomId) {
          await addNewBooking({
            resourceId: roomId,
            title: label,
            start: newStartDate,
            end: newEndDate,
            token: token,
          });
          dispatch(fetchBookingsByUser(setErrorMessage));
        }
      } catch (error) {
        setErrorMessage(error);
      }

        handleClose();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [label, roomId, startTime, endTime]);

  return (
    <div>
      <Modal
        open={open}
        onClose={handleClose}
        className={modal}
        slotProps={{backdrop: { className: backdrop }}}
      >
        <Box
          className={box}
          sx={boxPosition}
        >
          <Typography
            variant="h3"
            className={typography}
            id={styles.typography}
          >
            Book a room
          </Typography>

          <TextField
            label="label"
            className={textField}
            onChange={(event) => setLabel(event.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <Box
            className={datePickerWrapper}
          >
            <AccessTimeIcon />
            <DatePicker
              value={startDate}
              handleChange={handleChange}
              startTime={startTime}
              endTime={endTime}
              startTimeOnChange={handleStartTimeEvent}  
              endTimeOnChange={handleEndTimeEvent}  
            />
          </Box>
          <SelectInput
            handleChange={(event: SelectChangeEvent<any>) => {
              setSelectedRoom(event.target.value)
              setRoomId(event.target.value)
            }}
            data={rooms}
            defaultValue={selectedRoom}
            value={roomId}
            note="There are available rooms"
          />
          <SelectInput
            handleChange={handleRepeatEventChange}
            data={repeatData}
            value={repeatEvent}
            note="Select repeat options"
          />
          <Box className={buttonWrapper}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmitBooking}>Book</Button>
          </Box>
        </Box>
      </Modal>
    </div>
  )
};

export default BookingModal;
