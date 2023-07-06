import axios from "axios";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

export const sendQuery = (query: any): Promise<any> => {
  return axios.post(`http://3.11.136.62:4000/graphql?`, {
    query,
  });
};

export const getRooms = () => {
  return `{
    getRooms {
      id,
      name,
      description
    }
  }`;
};

export const getBookings = () => {
  return `{
    getBookings {
      id,
      participants,
      resourceId,
      title,
      description,
      start,
      end
    }
  }`;
};

export const getBookingsByUser = (userId: string) => {
  return `{
    getBookingsByUser(participantId: "${userId}") {
      id,
      participants,
      resourceId,
      title,
      description,
      start,
      end
    }
  }`;
};

export const getUsers = () => {
  return `{
    getUsers {
      id,
      email,
      password,
      username,
      picture
    }
  }`;
};

export const getUserById = (id: string) => {
  return `{
    getUserById(id: "${id}") {
      id,
      email,
      password,
      username,
      picture
    }
  }`;
};

export const sendAuthorizedQuery = (
  query: string,
  token: string
): Promise<any> => {
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };
  return axios.post(
    `${BACKEND_URL}/graphql?`,
    {
      query,
    },
    config
  );
};

export const loginMutation = (
  username: string,
  email: string,
  password: string,
  access_token: string,
  picture: string,
  hd: string,
  expires_in: number
) => {
  return `mutation {
    login(
      loginInput:{
        username:"${username}", 
        email:"${email}", 
        password:"${password}",
        access_token:"${access_token}", 
        picture:"${picture}", 
        hd: "${hd}", 
        expires_in: ${expires_in}
      }) {
       id,
        email,
        username,
        picture,
        access_token,
        hd,
        expires_in
    }
  }`;
};

export const bookingMutation = (
  roomId: String,
  label: String,
  startDate: String,
  endDate: String,
  userId: String
) => {
  return `mutation {
    createBooking(
      participants: ["${userId}"],
      resourceId: "${roomId}",
      title: "${label}",
      description: "${label}",
      start: "${startDate}",
      end: "${endDate}"
    ){
      id,
      participants, 
      resourceId,
      title,
      description,
      start,
      end
    }
  }`;
};

export const deleteBooking = (id: string | number) => `mutation{deleteBooking(id:"${id}"){title}}`;

export const updateBooking = (
  id: String | number,
  roomId: String,
  label: String,
  startDate: String | Date,
  endDate: String | Date,
  userId: String
) => {
  return `mutation {
    updateBooking(
      id: "${id}",
      resourceId: "${roomId}",
      title: "${label}",
      description: "${label}",
      start: "${startDate}",
      end: "${endDate}",
      participants: ["${userId}"]
      ){
        id,
        participants, 
        resourceId,
        title,
        description,
        start,
        end
      }}`;
};
