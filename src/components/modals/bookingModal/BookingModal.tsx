import React, { FC, useState } from "react";
import { Alert, Box, Button, Modal, SelectChangeEvent, TextField, Typography } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from '@mui/icons-material/Close';
import { addMinutes, isBefore } from "date-fns";

import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { setBookings } from "../../../redux/reducers/bookingsSlice";
import { setErrorMessage } from "../../../redux/reducers/errorMessage";
import { IEvent, NewBookingType } from "../../../utils/types";
import { getValidTime, isTimeOverlapping, newDateGenerator, timeConverter } from "../../../utils/dateUtils";
import { getAvailableRooms, handleSelectDate } from "../../../utils/modalUtils";
import { bookingMutation, sendAuthorizedQuery } from "../../../graphqlHelper";

import SelectInput from "../../UIs/Select/SelectInput";
import DatePicker from "../../UIs/datePicker/DatePicker";

import styles from "./bookingModal.module.css";
import { roomsData } from "../../../redux/reducers/roomsSlice";

interface BookingModalProps {
  openBookingModal: boolean;
  closeBookingModal: () => void;
  position: { x: number; y: number };
  selectedSlot: {
    start: Date;
    end: Date;
    resourceId: string;
  };
  events: IEvent[];
}

const {
  modal, box, typography, backdrop, datePickerWrapper, buttonWrapper, textField, alert, closeModal
} = styles;


const BookingModal: FC<BookingModalProps> = ({
  events,
  position,
  selectedSlot,
  openBookingModal,
  closeBookingModal,
}) => {
  const dispatch = useAppDispatch();
  const rooms = useAppSelector(roomsData);
  const { currentUser } = useAppSelector((state) => state.users);
  const { allBookings } = useAppSelector((state) => state.bookings);
  const [newBooking, setNewBooking] = useState<NewBookingType>({
    ...selectedSlot,
    id: "",
    title: "",
    participants: [],
  });
  const { resourceId, start, end, title } = newBooking;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const defaultEndTime = addMinutes(end, 15);
  const [startTime, setStartTime] = useState(`${timeConverter(start.getHours())}:${timeConverter(start.getMinutes())}`);
  const [endTime, setEndTime] = useState(`${timeConverter(defaultEndTime.getHours())}:${timeConverter(defaultEndTime.getMinutes())}`);
  const newStartDate = newDateGenerator(startDate, startTime);
  const newEndDate = newDateGenerator(endDate, endTime);
  const boxPosition = {
    left: position.x > 70 ? "70%" : `${position.x}%`,
    top: position.y > 518 ? 518 : position.y > 18 ? position.y : 18,
  };

  const availableRooms = getAvailableRooms({ events, selectedRoom: resourceId, start, newStartDate, newEndDate, rooms });

  const isValidTime = getValidTime(newStartDate, newEndDate);

  const isBookingOverlapping = isTimeOverlapping(newBooking, newStartDate, newEndDate, events);

  const isPastBooking =
    isBefore(newDateGenerator(start, startTime), new Date()) &&
    isBefore(newDateGenerator(end, endTime), new Date());

  const handleSubmitBooking = async () => {
    const { id, access_token } = currentUser.login;
    if (!isBookingOverlapping) {
      try {
        if (access_token && resourceId) {
          const response = await sendAuthorizedQuery(
            bookingMutation(
              resourceId,
              title,
              String(newStartDate),
              String(newEndDate),
              id
            ),
            access_token
          );

          const { data } = response.data;

          closeBookingModal();

          dispatch(
            setBookings([
              ...allBookings,
              {
                ...newBooking,
                id: data.createBooking.id,
                start: String(newStartDate),
                end: String(newEndDate),
                participants: [id],
              },
            ])
          );
          return data;
        }
      } catch (error) {
        dispatch(setErrorMessage(error));
      }
    }
  }

  return (
    <div>
      <Modal
        open={openBookingModal}
        onClose={closeBookingModal}
        className={modal}
        slotProps={{ backdrop: { className: backdrop } }}
      >
        <Box className={box} sx={boxPosition}>
          <Button className={closeModal} onClick={closeBookingModal}><CloseIcon /></Button>
          {isPastBooking && (
            <Alert severity="error" className={alert}>
              The default selected time below is already in the past. Feel free to modify that and save your booking!
            </Alert>
          )}
          <Typography
            variant="h3"
            className={typography}
            id={styles.typography}
          >
            Book a room
          </Typography>
          <TextField
            label="Title"
            className={textField}
            onChange={(event) =>
              setNewBooking({ ...newBooking, title: event.target.value })
            }
            InputLabelProps={{
              shrink: true,
            }}
            size="small"
          />
          <Box>
            <Box className={datePickerWrapper}>
              <AccessTimeIcon />
              <DatePicker
                value={start}
                handleChange={(value) =>
                  handleSelectDate(
                    {
                      value,
                      booking: newBooking,
                      setBooking: setNewBooking,
                      startTime,
                      endTime
                    }
                  )
                }
                startTime={startTime}
                endTime={endTime}
                startTimeOnChange={(event) => setStartTime(event.target.value)}
                endTimeOnChange={(event) => setEndTime(event.target.value)}
              />
            </Box>
            {isBookingOverlapping && (
              <Alert severity="error" className={alert}>
                This room is already booked for the time you selected.
              </Alert>
            )}
          </Box>

          {availableRooms.length > 0 &&
            <SelectInput
              handleChange={(event: SelectChangeEvent<any>) => {
                setNewBooking({ ...newBooking, resourceId: event.target.value });
              }}
              data={availableRooms}
              defaultValue={resourceId}
              value={resourceId}
            />
          }

          {availableRooms.length === 0 && (
            <Alert className={alert} severity='error'>
              There is no available room for the selected time or the selected time is invalid.
            </Alert>
          )}
          <Box className={buttonWrapper}>
            <Button onClick={closeBookingModal}>Cancel</Button>
            <Button
              disabled={isPastBooking || isBookingOverlapping || !isValidTime}
              variant="contained"
              onClick={handleSubmitBooking}
            >
              Book
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default BookingModal;
