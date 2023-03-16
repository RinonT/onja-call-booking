import { FC, useState } from "react";
import {
  Box,
  Button,
  Modal,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { roomsData } from "../../../redux/reducers/roomsSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
  fetchBookingsByUser,
  updateSelectedBooking,
} from "../../../redux/actions/bookings";
import { setErrorMessage } from "../../../redux/reducers/errorMessage";
import {
  isValidTime,
  newDateGenerator,
  timeConverter,
} from "../../../utils/dateUtils";
import { IEvent, newBookingType } from "../../../utils/types";
import { deleteBooking, sendAuthorizedQuery } from "../../../graphqlHelper";

import SelectInput from "../../UIs/Select/SelectInput";
import DatePicker from "../../UIs/datePicker/DatePicker";

import styles from "./editBookingModal.module.css";

interface EditModalProps {
  position: { x: number; y: number };
  showEditBookingModal: boolean;
  selectedBooking: IEvent;
  repeatData: { name: string; id: string }[];
  setShowEditBookingModal: (value: boolean) => void;
  setSelectedBooking: (value: IEvent) => void;
  events: IEvent[];
  handleSelectDate: (
    value: any,
    booking: newBookingType | IEvent,
    setBooking: (value: IEvent) => void,
    startTime: string,
    endTime: string
  ) => void;
}

const EditBookingModal: FC<EditModalProps> = ({
  position,
  showEditBookingModal,
  selectedBooking,
  repeatData,
  setShowEditBookingModal,
  setSelectedBooking,
  handleSelectDate,
  events,
}) => {
  const {
    modal,
    box,
    typography,
    backdrop,
    datePickerWrapper,
    buttonWrapper,
    textField,
    buttonContainer,
    deleteButton,
  } = styles;
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.users);
  const userId = currentUser.login.id;
  const { access_token } = currentUser.login;
  const rooms = useAppSelector(roomsData);
  const { title, start, end, resourceId, id } = selectedBooking;

  const getHours = (time: Date) => timeConverter(time.getHours());
  const getMinutes = (time: Date) => timeConverter(time.getMinutes());

  const [isDeletionConfirmed, setIsDeletionConfirmed] = useState(false);
  const [startTime, setStartTime] = useState(
    `${getHours(start)}:${getMinutes(start)}`
  );
  const [endTime, setEndTime] = useState(`${getHours(end)}:${getMinutes(end)}`);

  const newStartDate = newDateGenerator(start, startTime);
  const newEndDate = newDateGenerator(end, endTime);

  const boxPosition = {
    left: position.x > 70 ? "70%" : `${position.x}%`,
    top: position.y > 518 ? 518 : position.y > 18 ? position.y : 18,
  };

  const isDisabledButton = () => {
    const savedBooking = events.find((event: IEvent) => event.id === id);

    const isDateEdited =
      JSON.stringify(newStartDate) === JSON.stringify(savedBooking?.start) &&
      resourceId === savedBooking?.resourceId &&
      JSON.stringify(newEndDate) === JSON.stringify(savedBooking?.end);

    return (
      (title === savedBooking?.title && isDateEdited) ||
      !isValidTime(newStartDate, newEndDate)
    );
  };

  const handleEditBooking = async () => {
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
    setShowEditBookingModal(false);
  };

  const onDeleteEvent = async () => {
    try {
      if (selectedBooking.id) {
        const response = await sendAuthorizedQuery(
          deleteBooking(selectedBooking.id),
          access_token
        );
        setShowEditBookingModal(false);
        dispatch(fetchBookingsByUser(userId));
        return response.data.data;
      }
    } catch (error) {
      dispatch(setErrorMessage(error));
    }
  };

  return (
    <div>
      <Modal
        open={showEditBookingModal}
        onClose={() => setShowEditBookingModal(false)}
        className={modal}
        slotProps={{ backdrop: { className: backdrop } }}
      >
        <Box className={box} sx={boxPosition}>
          <Typography variant="h3" className={typography}>
            Edit booking
          </Typography>

          <TextField
            label="label"
            className={textField}
            defaultValue={title}
            onChange={(event) =>
              setSelectedBooking({
                ...selectedBooking,
                title: event.target.value,
              })
            }
            InputLabelProps={{
              shrink: true,
            }}
            size="small"
          />

          <Box className={datePickerWrapper}>
            <AccessTimeIcon />
            <DatePicker
              value={start}
              handleChange={(value) =>
                handleSelectDate(
                  value,
                  selectedBooking,
                  setSelectedBooking,
                  startTime,
                  endTime
                )
              }
              startTime={startTime}
              endTime={endTime}
              startTimeOnChange={(event) => setStartTime(event.target.value)}
              endTimeOnChange={(event) => setEndTime(event.target.value)}
            />
          </Box>

          <SelectInput
            handleChange={(event: SelectChangeEvent<any>) => {
              setSelectedBooking({
                ...selectedBooking,
                resourceId: event.target.value,
              });
            }}
            data={rooms}
            defaultValue={resourceId}
            value={resourceId}
            note="There are available rooms"
          />

          <SelectInput
            handleChange={(event) => event}
            data={repeatData}
            value={repeatData[0].id}
            note="Select repeat options"
          />

          <Box className={buttonContainer}>
            {isDeletionConfirmed && (
              <Button className={deleteButton} onClick={onDeleteEvent}>
                Confirm deletion
              </Button>
            )}

            {!isDeletionConfirmed && (
              <Button
                className={deleteButton}
                onClick={() => setIsDeletionConfirmed(true)}
              >
                Delete
              </Button>
            )}

            <Box className={buttonWrapper}>
              <Button onClick={() => setShowEditBookingModal(false)}>
                Cancel
              </Button>
              <Button disabled={isDisabledButton()} onClick={handleEditBooking}>
                Save
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default EditBookingModal;
