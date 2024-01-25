import dotenv from "dotenv";
import axios from "axios";
import AppError from "../utils/AppError";

dotenv.config();

interface MeetingOptions {
  topic: string;
  duration: number;
  startDateTime: Date;
}

const apiBaseUrl = "https://www.googleapis.com/calendar/v3/calendars";

export default class GoogleMeetService {
  private async getAccessToken(): Promise<string> {
    // Implement your logic to get Google Meet API access token
    // Use the appropriate credentials, similar to what you did for Zoom
    // ...

    // Example:
    const accessToken = "YOUR_GOOGLE_MEET_ACCESS_TOKEN";
    return accessToken;
  }

  async createMeeting({
    topic,
    duration,
    startDateTime,
  }: MeetingOptions): Promise<string> {
    const accessToken = await this.getAccessToken();
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const payload = {
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: "UTC", // Adjust this based on your requirements
      },
      end: {
        dateTime: new Date(
          startDateTime.getTime() + duration * 60000,
        ).toISOString(),
        timeZone: "UTC",
      },
      summary: topic,
      description: "Google Meet created through custom service",
    };

    try {
      const meetingResponse = await axios.post(
        `${apiBaseUrl}/primary/events`,
        payload,
        { headers },
      );

      if (meetingResponse.status !== 200) {
        console.log("Unable to generate meeting link");
        throw new AppError(400, "Can't generate meeting link!");
      }

      const response_data = meetingResponse.data;
      return response_data.hangoutLink; // Google Meet link
    } catch (error) {
      console.error(error);
      throw new AppError(
        400,
        "Something went wrong while creating Google Meet!",
      );
    }
  }
}
