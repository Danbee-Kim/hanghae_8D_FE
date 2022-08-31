import styled from 'styled-components';
import { a11yHidden } from 'styles/mixin';


const Textarea = ({ Label,isHide, onChangeHandler,placeholder }) => {
  return (
    <StTextareaContainer>
      <label htmlFor="textarea" className={isHide ? 'a11y-hidden' : ''}>
        {Label}
      </label>
      <StTextarea
        id="textarea"
        name="content"
        placeholder={placeholder}
        onChange={onChangeHandler}
      ></StTextarea>
    </StTextareaContainer>
  );
};

Textarea.defaultProps = {
  Label: '내용',
  isHide: false,
  changeHandler: null,
  placeholder:"품목에 대한 설명을 작성해 주세요 (400자 이내)"
};


const StTextareaContainer = styled.div`
  display: flex;
  .a11y-hidden {
    ${a11yHidden}
  }
  `;

const StTextarea = styled.textarea`
  width: 100%;
  border: 1px solid #999999;
  border-radius: 5px;
  padding: 12px 20px;
  `;

export default Textarea;