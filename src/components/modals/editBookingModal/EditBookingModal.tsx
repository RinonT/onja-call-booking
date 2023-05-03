import { FC, useState } from "react";
import { Alert, Box, Button, Modal, SelectChangeEvent, TextField, Typography } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from '@mui/icons-material/Close';
import { isBefore } from "date-fns";

import { roomsData } from "../../../redux/reducers/roomsSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { updateSelectedBooking } from "../../../redux/actions/bookings";
import { setErrorMessage } from "../../../redux/reducers/errorMessage";
import { setBookings } from "../../../redux/reducers/bookingsSlice";
import { isTimeOverlapping, getValidTime, newDateGenerator, timeConverter } from "../../../utils/dateUtils";
import { Booking, IEvent, RoomType } from "../../../utils/types";
import { getAvailableRooms, handleSelectDate } from "../../../utils/modalUtils";
import { deleteBooking, sendAuthorizedQuery } from "../../../graphqlHelper";

import SelectInput from "../../UIs/Select/SelectInput";
import DatePicker from "../../UIs/datePicker/DatePicker";

import styles from "./editBookingModal.module.css";

interface EditModalProps {
  position: { x: number; y: number };
  openEditBookingModal: boolean;
  selectedEvent: IEvent;
  setOpenEditBookingModal: (value: boolean) => void;
  events: IEvent[];
}

const {
  modal, box, typography, backdrop, datePickerWrapper, buttonWrapper, textField,
  buttonContainer, deleteButton, alert, closeModal
} = styles;

const EditBookingModal: FC<EditModalProps> = ({
  events,
  position,
  selectedEvent,
  openEditBookingModal,
  setOpenEditBookingModal,
}) => {
  const boxPosition = {
    left: position.x > 70 ? "70%" : `${position.x}%`,
    top: position.y > 518 ? 518 : position.y > 18 ? position.y : 18,
  };

  const dispatch = useAppDispatch();
  const { allBookings } = useAppSelector((state) => state.bookings);
  const { currentUser } = useAppSelector((state) => state.users);
  const userId = currentUser?.login?.id;
  const { access_token } = currentUser?.login;
  const rooms: RoomType[] = useAppSelector(roomsData);
  const [bookingToUpdate, setBookingToUpdate] = useState<IEvent>({ ...selectedEvent });
  const { title, start, end, resourceId, id } = bookingToUpdate;
  const savedBooking = events.find((event: IEvent) => event.id === id);
  const bookings = events.filter((booking: IEvent) => booking.id !== id);
  const [isDeletionConfirmed, setIsDeletionConfirmed] = useState(false);

  // Date and Time utilities and States
  const getHours = (time: Date) => timeConverter(time.getHours());
  const getMinutes = (time: Date) => timeConverter(time.getMinutes());

  const [startTime, setStartTime] = useState(`${getHours(start)}:${getMinutes(start)}`);
  const [endTime, setEndTime] = useState(`${getHours(end)}:${getMinutes(end)}`);

  const newStartDate = newDateGenerator(start, startTime);
  const newEndDate = newDateGenerator(end, endTime);

  const isTimeEdited =
    JSON.stringify(newStartDate) !== JSON.stringify(savedBooking?.start) ||
    JSON.stringify(newEndDate) !== JSON.stringify(savedBooking?.end);

  const isBookingOverlapping = isTimeOverlapping(
    bookingToUpdate,
    newStartDate,
    newEndDate,
    bookings
  );

  const isPastBooking =
    isBefore(newDateGenerator(start, startTime), new Date()) &&
    isBefore(newDateGenerator(end, endTime), new Date());

  const isBookingEdited =
    (resourceId === savedBooking?.resourceId && title === savedBooking?.title && !isTimeEdited);

  const isValidTime = getValidTime(newStartDate, newEndDate);

  const availableRooms = getAvailableRooms({ events, selectedRoom: resourceId, start, newStartDate, newEndDate, rooms });

  const handleEditBooking = () => {
    dispatch(
      updateSelectedBooking(
        id,
        resourceId,
        title,
        String(newStartDate),
        String(newEndDate),
        userId,
        access_token
      )
    );

    const updatedBookings = allBookings.map((booking: Booking) => {
      if (booking?.id === id) {
        return {
          ...booking,
          resourceId,
          title,
          start: String(newStartDate),
          end: String(newEndDate),
        };
      }
      return booking;
    });

    dispatch(setBookings(updatedBookings));
    setOpenEditBookingModal(false);
  };

  const onDeleteEvent = async () => {
    try {
      if (id) {
        const response = await sendAuthorizedQuery(deleteBooking(id), access_token);
        setOpenEditBookingModal(false);
        const bookings = allBookings.filter((booking: Booking) => booking.id !== id);
        dispatch(setBookings(bookings));
        return response.data.data;
      }
    } catch (error) {
      dispatch(setErrorMessage(error));
    }
  };

  return (
    <Box>
      <Modal
        open={openEditBookingModal}
        onClose={() => setOpenEditBookingModal(false)}
        className={modal}
        slotProps={{ backdrop: { className: backdrop } }}
      >
        <Box className={box} sx={boxPosition}>
          <Button className={closeModal} onClick={() => setOpenEditBookingModal(false)}><CloseIcon /></Button>
          {isPastBooking && (
            <Alert severity="error" className={alert}>
              The default selected time below is already in the past. Feel free to modify that and save your booking!
            </Alert>
          )}
          <Typography variant="h3" className={typography}>
            Edit booking
          </Typography>
          <TextField
            label="Title"
            className={textField}
            defaultValue={title}
            onChange={(event) =>
              setBookingToUpdate({
                ...bookingToUpdate,
                title: event.target.value,
              })
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
                handleChange={(value) => {
                  const selectedDate = {
                    value,
                    booking: bookingToUpdate,
                    setBooking: setBookingToUpdate,
                    startTime,
                    endTime
                  }
                  handleSelectDate(selectedDate);
                }}
                startTime={startTime}
                endTime={endTime}
                startTimeOnChange={(event) => setStartTime(event.target.value)}
                endTimeOnChange={(event) => setEndTime(event.target.value)}
              />
            </Box>
            <Box className={buttonContainer}>
              {isBookingOverlapping && (
                <Alert severity="error" className={alert}>
                  This room is already booked for the time you selected.
                </Alert>
              )}
            </Box>
          </Box>
          {availableRooms.length > 0 &&
            <SelectInput
              handleChange={(event: SelectChangeEvent<any>) => {
                setBookingToUpdate({
                  ...bookingToUpdate,
                  resourceId: event.target.value,
                });
              }}
              data={availableRooms}
              defaultValue={resourceId}
              value={resourceId}
            />
          }
          <Box className={buttonContainer}>
            <Button
              className={deleteButton}
              onClick={() => isDeletionConfirmed ? onDeleteEvent() : setIsDeletionConfirmed(true)}
            >
              {!isDeletionConfirmed ? "Delete" : "Confirm deletion"}
            </Button>
            <Box className={buttonWrapper}>
              <Button onClick={() => setOpenEditBookingModal(false)}>
                Cancel
              </Button>
              <Button
                disabled={
                  isPastBooking || isBookingEdited || isBookingOverlapping || !isValidTime
                }
                variant="contained"
                onClick={handleEditBooking}
              >
                Save
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default EditBookingModal;
