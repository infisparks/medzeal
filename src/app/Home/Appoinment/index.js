import Image from "next/image";

import ContactImg from "../../../../public/img/contact-img.png";
import DateInput from "./DateInput";
import SectionHead from "../../../components/SectionHead";

export default function Appoinment() {
  return (
    <>
      <section className="appointment">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <SectionHead
                title="We Are Always Ready to Help You. Book An Appointment"
                desc="Lorem ipsum dolor sit amet consectetur adipiscing elit praesent aliquet. pretiumts"
              />
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6 col-md-12 col-12">
              <form className="form" action="#">
                <div className="row">
                  <div className="col-lg-6 col-md-6 col-12">
                    <div className="form-group">
                      <input name="name" type="text" placeholder="Name" />
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-6 col-12">
                    <div className="form-group">
                      <input name="email" type="email" placeholder="Email" />
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-6 col-12">
                    <div className="form-group">
                      <input name="phone" type="text" placeholder="Phone" />
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-6 col-12">
                    <div className="form-group">
                      <select
                        aria-label="Default select example"
                        className="form-select"
                      >
                        <option>Department</option>
                        <option value="1"> Cardiac Clinic</option>
                        <option value="2"> Neurology</option>
                        <option value="3"> Dentistry</option>
                        <option value="4"> Gastroenterology</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-6 col-12">
                    <div className="form-group">
                      <select
                        aria-label="Default select example"
                        className="form-select"
                      >
                        <option>Doctor</option>
                        <option value="1"> Dr. Akther Hossain</option>
                        <option value="2">Dr. Dery Alex</option>
                        <option value="3"> Dr. Jovis Karon</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-6 col-12">
                    <div className="form-group">
                      <DateInput />
                    </div>
                  </div>
                  <div className="col-lg-12 col-md-12 col-12">
                    <div className="form-group">
                      <textarea
                        name="message"
                        placeholder="Write Your Message Here....."
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-lg-5 col-md-4 col-12">
                    <div className="form-group">
                      <div className="button">
                        <button type="submit" className="btn">
                          Book An Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-7 col-md-8 col-12">
                    <p>( We will be confirm by an Text Message )</p>
                  </div>
                </div>
              </form>
            </div>
            <div className="col-lg-6 col-md-12 ">
              <div className="appointment-image">
                <Image src={ContactImg} alt="#" width={522} height={523} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
